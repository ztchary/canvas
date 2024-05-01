async function apiGet(sub, token, uri) {
  let resp = await fetch(
    `https://canvasapi.ztchary.com/${uri}?sub=${sub}&token=${token}`,
  );
  return await resp.json();
}

function clearContent() {
  let content = document.querySelector(".content");
  content.innerHTML = "";
  return content;
}

function addTd(tr, data) {
  let td = document.createElement("td");
  tr.appendChild(td);
  td.appendChild(data);
}

function setText(tag, data) {
  tag.appendChild(document.createTextNode(data));
}

async function renderMissing(sub, token) {
  const courses = await apiGet(sub, token, "courses");
  const missing = await apiGet(sub, token, "missing");

  let content = clearContent();

  for (let [cid, asgns] of Object.entries(missing)) {
    let h1 = document.createElement("h1");
    let hr = document.createElement("hr");
    let table = document.createElement("table");
    content.appendChild(h1);
    content.appendChild(hr);
    content.appendChild(table);
    setText(h1, courses[cid]);
    for (let asgn of asgns) {
      let tr = document.createElement("tr");
      table.appendChild(tr);
      let a = document.createElement("a");
      a.href = asgn.url;
      a.target = "_blank";
      setText(a, asgn.name);
      addTd(tr, document.createTextNode(`Due ${asgn.due}`));
      addTd(tr, document.createTextNode(`${asgn.points} points`));
      addTd(tr, a);
    }
  }
}

function tokenIsSet() {
  return localStorage.getItem("token") != null;
}

function getToken() {
  let sub = localStorage.getItem("sub");
  let token = localStorage.getItem("token");
  return [sub, token];
}

async function home() {
  let content = clearContent();
  document.querySelector("#navright").innerHTML = "";
  let h1 = document.createElement("h1");
  setText(h1, "Canvas Viewer");
  content.appendChild(h1);
  content.appendChild(document.createElement("hr"));
  let h3 = document.createElement("h3");
  setText(h3, "Access Token and Url");
  content.appendChild(h3);
  if (tokenIsSet()) {
    let [sub, token] = getToken();
    let p1 = document.createElement("p");
    let p2 = document.createElement("p");
    let reset = document.createElement("button");
    content.appendChild(p1);
    content.appendChild(p2);
    content.appendChild(reset);
    setText(p1, `Canvas Url: ${sub}.instructure.com`);
    setText(p2, `Access Token: ${token.slice(0, 10)}...`);
    setText(reset, "Reset");
    reset.onclick = () => {
      localStorage.removeItem("sub");
      localStorage.removeItem("token");
      home();
    };
  } else {
    let p = document.createElement("p");
    let sub = document.createElement("input");
    let token = document.createElement("input");
    let submit = document.createElement("button");
    content.appendChild(p);
    content.appendChild(sub);
    content.appendChild(document.createElement("br"));
    content.appendChild(token);
    content.appendChild(document.createElement("br"));
    content.appendChild(submit);
    setText(
      p,
      "Go to Canvas profile settings to generate an access token and enter it along with your canvas url here.",
    );
    sub.placeholder = "abc.instructure.com";
    token.placeholder = "1234~abcde...";
    setText(submit, "Set Access Token");
    submit.onclick = async function () {
      if (
        !sub.value.endsWith(".instructure.com") ||
        token.value.length != 69 ||
        token[4] == "~"
      ) {
        alert("Invalid Url or Access Token");
        return;
      }
      let valid = await apiGet(sub.value.slice(0, 3), token.value, "validate");
      if (!valid) {
        alert("Invalid Url or Access Token");
        return;
      }
      localStorage.setItem("sub", sub.value.slice(0, 3));
      localStorage.setItem("token", token.value);
      home();
    };
  }
}

async function missing() {
  if (!tokenIsSet()) {
    alert("Set an Access Token first");
    return;
  }
  let refresh = document.createElement("a");
  document.querySelector("#navright").appendChild(refresh);
  setText(refresh, "Refresh");
  refresh.onclick = async function () {
    let content = clearContent();
    let h1 = document.createElement("h1");
    content.appendChild(h1);
    setText(h1, "Loading");
    let [sub, token] = getToken();
    await renderMissing(sub, token);
  };
  refresh.onclick();
}

window.onload = function () {
  home();
};

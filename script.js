async function apiGet(tok, uri) {
  let resp = await fetch(
    `https://canvasapi.ztchary.com/${uri}?tok=${tok}`,
  );
  return await resp.json();
}

function clearContent() {
  document.querySelector("#navright").innerHTML = "";
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

async function missingRefresh() {
  let content = clearContent();
  let h1 = document.createElement("h1");
  content.appendChild(h1);
  setText(h1, "Loading");
  localStorage.tok;
  await renderMissing(localStorage.tok);
  let refresh = document.createElement("a");
  document.querySelector("#navright").appendChild(refresh);
  setText(refresh, "Refresh");
  refresh.href = "#";
  refresh.onclick = missingRefresh;
}

async function renderMissing(tok) {
  const courses = await apiGet(tok, "courses");
  const missing = await apiGet(tok, "missing");

  if (courses.err || missing.err) {
    localStorage.clear();
    accessToken();
    return;
  }

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

async function accessToken() {
  let content = clearContent();
  let h1 = document.createElement("h1");
  setText(h1, "Canvas Access Token");
  content.appendChild(h1);
  content.appendChild(document.createElement("hr"));
  if (localStorage.tok) {
    let p1 = document.createElement("p");
    let p2 = document.createElement("p");
    let reset = document.createElement("button");
    content.appendChild(p1);
    content.appendChild(p2);
    content.appendChild(reset);
    setText(p2, `Access Token: ${localStorage.tok.slice(0, 10)}...`);
    setText(reset, "Reset");
    reset.onclick = () => {
      localStorage.clear();
      accessToken();
    };
  } else {
    let p = document.createElement("p");
    let tok = document.createElement("input");
    let submit = document.createElement("button");
    content.appendChild(p);
    content.appendChild(tok);
    content.appendChild(document.createElement("br"));
    content.appendChild(submit);
    setText(
      p,
      "Go to Canvas profile settings to generate an Access Token and enter it here.",
    );
    tok.placeholder = "1234~abcde...";
    setText(submit, "Set Access Token");
    submit.onclick = async function () {
      let valid = await apiGet(tok.value, "validate");
      if (!valid) {
        alert("Invalid Access Token");
        return;
      }
      localStorage.setItem("tok", tok.value);
      accessToken();
    };
  }
}

async function missing() {
  if (!localStorage.tok) {
    alert("Set an Access Token first");
    return;
  }
  missingRefresh();
}

window.onload = function () {
  accessToken();
};

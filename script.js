async function apiGet(tok, uri) {
  let resp = await fetch(`https://canvasapi.ztchary.com/${uri}?tok=${tok}&url=${localStorage.url}`);
  return await resp.json();
}

function appendLoading(content, cls="loading") {
  if (document.querySelector("."+cls)) return;
  let loading = document.createElement("p");
  content.appendChild(loading);
  loading.classList.add(cls);
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

async function fetchMissing(tok) {
  const courses = await apiGet(tok, "courses");
  const missing = await apiGet(tok, "missing");
  if (courses.err || missing.err) {
    return courses.err + " , " + missing.err;
  }
  localStorage.courses = JSON.stringify(courses);
  localStorage.missing = JSON.stringify(missing);
  return null;
}

async function renderMissing(courses, missing) {
  let content = clearContent();

  if (!missing) {
    let h1 = document.createElement("h1");
    content.appendChild(h1);
    setText(h1, "No missing assignments.");
    return;
  }

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
      let a = document.createElement("a");
      table.appendChild(tr);
      a.href = asgn.url;
      a.target = "_blank";
      setText(a, asgn.name);
      addTd(tr, document.createTextNode(`Due ${asgn.due}`));
      addTd(tr, document.createTextNode(`${asgn.points} points`));
      addTd(tr, a);
    }
  }
}

async function tabAccessToken() {
  let content = clearContent();

  let h1 = document.createElement("h1");
  content.appendChild(h1);
  content.appendChild(document.createElement("hr"));

  if (localStorage.tok) {
    setText(h1, `Welcome, ${localStorage.name}`);
    let p1 = document.createElement("p");
    let p2 = document.createElement("p");
    let reset = document.createElement("button");
    content.appendChild(p1);
    content.appendChild(p2);
    content.appendChild(reset);
    setText(p2, `Access Token: ${localStorage.tok.slice(0, 10)}...`);
    setText(reset, "Reset");
    reset.onclick = () => {
      delete localStorage.tok;
      delete localStorage.courses;
      delete localStorage.missing;
      tabAccessToken();
    };
  } else {
    setText(h1, "Canvas Access Token");
    let p = document.createElement("p");
    let tok = document.createElement("input");
    let submit = document.createElement("button");
    content.appendChild(p);
    content.appendChild(tok);
    content.appendChild(document.createElement("br"));
    content.appendChild(submit);
    setText(p, "Generate an Access Token (canvas settings) and enter it here.");
    tok.placeholder = "1234~dQw4w9WgXcQ...";
    tok.size = 69;
    setText(submit, "Set Token");
    submit.onclick = async function() {
      appendLoading(content);
      let resp = await apiGet(tok.value, "validate");
      if (!resp.valid) {
        alert("Invalid access token");
        tabAccessToken();
        return;
      }
      localStorage.name = resp.name;
      localStorage.tok = tok.value;
      tabAccessToken();
    };
  }
}

async function tabMissing() {
  if (!localStorage.tok) {
    alert("Set an access token first");
    return;
  }

  let content = clearContent();

  let refresh = document.createElement("a");
  setText(refresh, "Refresh");
  refresh.href = "#";
  refresh.onclick = async function() {
    refresh.innerHTML = "";
    let span = document.createElement("span");
    refresh.appendChild(span);
    setText(span, "Refresh");
    appendLoading(refresh, "loadingRefresh");
    let err = await fetchMissing(localStorage.tok);
    if (err) {
      alert("Failed to load: " + err);
    }
    await tabMissing();
  };

  if (!localStorage.courses || !localStorage.missing) {
    refresh.onclick();
  } else {
    renderMissing(JSON.parse(localStorage.courses), JSON.parse(localStorage.missing));
  }
  document.querySelector("#navright").appendChild(refresh);
}

window.onload = function () {
  localStorage.url ??= "canvas.instructure.com";
  tabAccessToken();
};

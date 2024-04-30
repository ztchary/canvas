async function apiGet(sub, token, uri) {
  let resp = await fetch(`https://canvasapi.ztchary.com/${uri}?sub=${sub}&token=${token}`);
  return await resp.json();
}

async function clearContent() {
  document.querySelector(".content").innerHTML = "";
}

function addTd(tr, data) {
  let td = document.createElement("td");
  tr.appendChild(td);
  td.appendChild(data);
}

async function renderMissing(sub, token) {
  let content = document.querySelector(".content");
  const courses = await apiGet(sub, token, "courses");
  const missing = await apiGet(sub, token, "missing");

  clearContent();

  for (let [cid, asgns] of Object.entries(missing)) {
    let h1 = document.createElement("h1");
    let table = document.createElement("table");
    content.appendChild(h1);
    content.appendChild(document.createElement("hr"));
    content.appendChild(table);
    h1.appendChild(document.createTextNode(courses[cid]));
    for (let asgn of asgns) {
      let tr = document.createElement("tr");
      table.appendChild(tr);
      let a = document.createElement("a");
      a.href = asgn.url;
      a.target = "_blank";
      a.appendChild(document.createTextNode(asgn.name));
      addTd(tr, document.createTextNode(`Due ${asgn.due}`));
      addTd(tr, document.createTextNode(`${asgn.points} points`));
      addTd(tr, a);
    }
  }
}

window.onload = function() {
  renderMissing("abc", "####~...", "courses");
}
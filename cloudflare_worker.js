async function fetchApi(sub, token, uri) {
  let headers = new Headers([["Authorization", `Bearer ${token}`]]);
  let url = new URL(`https://${sub}.instructure.com/api/v1/users/self/${uri}?per_page=1000`);
  let resp = await fetch(url, { headers: headers });
  return await resp.json();
}

const routes = {
  "/courses": async function(sub, token) {
    let courses = await fetchApi(sub, token, "courses");
    console.log(courses);
    let out = {};
    for (let c of courses) {
      if (!c.course_code) {
        continue;
      }
      out[c.id] = c.course_code;
    }
    return out;
  },

  "/missing": async function(sub, token) {
    let asgns = await fetchApi(sub, token, "missing_submissions");
    let out = {};

    for (let a of asgns) {
      let cid = a.course_id;

      let points = a.points_possible;
      let url = a.html_url;
      let name = a.name;
      let due = a.due_at.substr(0, 10);

      if (!out[cid]) {
        out[cid] = [];
      }

      out[cid].push({
        points: points,
        url: url,
        name: name,
        due: due
      });
    }

    return out;
  },

  "/validate": async function(sub, token) {
    let o = await fetchApi(sub, token, "courses");
    return o.message == undefined && o.errors == undefined;
  }
}

export default {
  async fetch(request, env, ctx) {
    let url = new URL(request.url);
    if (!routes[url.pathname]) {
      let s = { status: 404 }
      return new Response(JSON.stringify(s), s);
    }
    let sub = url.searchParams.get("sub");
    let token = url.searchParams.get("token");
    if (!sub || !token) {
      let s = { status: 400 }
      return new Response(JSON.stringify(s), s);
    }
    let res = await routes[url.pathname](sub, token);
    let corsheader = new Headers([["Access-Control-Allow-Origin", "*"]]);
    return new Response(JSON.stringify(res), { headers: corsheader });
  }
};

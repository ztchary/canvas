async function fetchApi(tok, url, uri, params = { per_page: "1000", only_active_courses: "true" }) {
  let headers = new Headers([["Authorization", `Bearer ${tok}`]]);
  let furl = new URL(`https://${url}/api/v1/users/self${uri}`);
  furl.search = new URLSearchParams(params).toString();
  let resp = await fetch(furl, { headers: headers });
  return await resp.json();
}

const routes = {
  "/validate": async function(tok, url) {
    let resp = await fetchApi(tok, url, "");

    if (resp.name !== undefined) {
      return [{ valid: true, name: resp.first_name }, 200];
    }

    return [{ valid: false }, 200];
  },

  "/courses": async function(tok, url) {
    let resp = await fetchApi(tok, url, "/courses");

    if (resp.errors !== undefined) {
      return [{"err": resp.errors[0].message}, 500];
    }

    let out = {};

    for (let c of resp) {
      if (c.course_code === undefined) {
        continue;
      }
      out[c.id] = c.course_code;
    }

    return [out, 200];
  },

  "/missing": async function(tok, url) {
    let resp = await fetchApi(tok, url, "/missing_submissions");

    if (resp.errors) {
      return [{"err": resp.errors[0].message}, 500];
    }

    let out = {};

    for (let a of resp) {
      let cid = a.course_id;

      let points = a.points_possible;
      let url = a.html_url;
      let name = a.name;
      let due = a.due_at.substr(0, 10);

      if (points == 0) {
        continue;
      }

      let obj = {
        points: points,
        url: url,
        name: name,
        due: due
      };

      out[cid] ??= [];

      out[cid].push(obj);
    }

    return [out, 200];
  },

  "/activity": async function(tok, url) {
    let resp = await fetchApi(tok, url, "/activity_stream");

    if (resp.errors !== undefined) {
      return [{"err": resp.errors[0].message}, 500];
    }

    let out = {};

    for (let item of resp) {
      if (item.context_type != "Course") {
        continue;
      }

      let obj = {
        title: item.title,
        msg: item.message,
        url: item.url
      };
      
      let type = item.type.toLowerCase();

      out[type] ??= {};
      out[type][item.course_id] ??= [];

      out[type][item.course_id].push(obj);
    }
    return [out, 200];
  },

  "/upcoming": async function(tok, url) {
    let resp = await fetchApi(tok, url, "/upcoming_events");

    if (resp.errors !== undefined) {
      return [{"err": resp.errors[0].message}, 500];
    }

    let out = {};

    for (let item of resp) {
      let asgn = item.assignment;
      if (asgn === undefined) {
        continue;
      }

      let id = asgn.course_id;

      let obj = {
        points: asgn.points_possible,
        url: asgn.url,
        name: asgn.name,
        due: asgn.due_at
      };

      out[id] = obj;
    }
  }
}

export default {
  async fetch(request, env, ctx) {
    let url = new URL(request.url);

    if (routes[url.pathname] === undefined) {
      let s = { status: 404 }
      return new Response(JSON.stringify(s), s);
    }

    let tok = url.searchParams.get("tok");
    let surl = url.searchParams.get("url") ?? "canvas.instructure.com";

    if (tok === null) {
      let s = { status: 400 }
      return new Response(JSON.stringify(s), s);
    }

    let [res, status] = await routes[url.pathname](tok, surl);
    let corsheader = new Headers([["Access-Control-Allow-Origin", "*"]]);
    return new Response(JSON.stringify(res), { headers: corsheader, status: status });
  }
};

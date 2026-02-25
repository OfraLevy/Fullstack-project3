// js/network/ServerRouter.js
class ServerRouter {
  constructor() {
    this.authServer = new AuthServer();
    this.appServer = new AppServer();
  }

  // url examples:
  // http://auth/register
  // http://app/tasks/123?search=abc
  route(request) {
    var parsed = this._parseUrl(request.url || "");
    if (!parsed.host) {
      return makeResponse(400, { message: "Bad URL (missing host)", data: null });
    }

    request.path = parsed.path;
    request.query = parsed.query;

    if (parsed.host === "auth") {
      return this.authServer.handle(request);
    }
    if (parsed.host === "app") {
      return this.appServer.handle(request);
    }

    return makeResponse(404, { message: "Unknown host", data: { host: parsed.host } });
  }

  _parseUrl(url) {
    // Supports:
    // http://auth/login
    // http://app/tasks/1?search=a
    // Returns: { protocol, host, path, query }
    var out = { protocol: null, host: null, path: "/", query: {} };

    var protoSplit = url.split("://");
    if (protoSplit.length !== 2) return out;

    out.protocol = protoSplit[0]; // "http" (we don't really enforce it)
    var rest = protoSplit[1];     // "auth/login?x=1"

    // host is until first "/"
    var slashIdx = rest.indexOf("/");
    if (slashIdx === -1) {
      // e.g. "auth" only
      out.host = rest;
      out.path = "/";
      return out;
    }

    out.host = rest.slice(0, slashIdx); // "auth" or "app"
    var afterHost = rest.slice(slashIdx); // "/login?x=1"

    // split query
    var qIndex = afterHost.indexOf("?");
    var pathPart = qIndex >= 0 ? afterHost.slice(0, qIndex) : afterHost;
    var queryPart = qIndex >= 0 ? afterHost.slice(qIndex + 1) : "";

    out.path = pathPart || "/";
    out.query = this._parseQuery(queryPart);
    return out;
  }

  _parseQuery(qs) {
    var query = {};
    if (!qs) return query;

    var pairs = qs.split("&");
    for (var i = 0; i < pairs.length; i++) {
      var p = pairs[i];
      if (!p) continue;

      var kv = p.split("=");
      var k = decodeURIComponent(kv[0] || "").trim();// decode url-encoded keys
      var v = decodeURIComponent(kv[1] || "").trim();// decode url-encoded values
      if (!k) continue;
      query[k] = v;
    }
    return query;
  }
}
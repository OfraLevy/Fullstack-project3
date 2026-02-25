// js/server/AuthServer.js
class AuthServer {
  constructor() {
    this.sessions = new SessionStore();
  }

  handle(req) {
    try {
      if (!req || !req.method || !req.path) {
        return makeResponse(400, { message: "Bad request", data: null });
      }

      var method = String(req.method).toUpperCase();
      var path = req.path;

      if (method === "POST" && path === "/register") return this._register(req);
      if (method === "POST" && path === "/login") return this._login(req);
      if (method === "POST" && path === "/logout") return this._logout(req);

      return makeResponse(404, { message: "Route not found", data: null });
    } catch (e) {
      return makeResponse(500, { message: "Server error", data: { error: e.message } });
    }
  }

  _register(req) {
    var body = req.body || {};
    var username = (body.username || "").trim();
    var password = (body.password || "").trim();

    if (!username || !password) {
      return makeResponse(400, { message: "username/password required", data: null });
    }

    try {
      var user = UsersApiDB.createUser(username, password);
      return makeResponse(201, { message: "Registered", data: { userId: user.id } });
    } catch (e) {
      // כפילות שם משתמש
      if (String(e.message || "").toLowerCase().indexOf("exists") !== -1) {
        return makeResponse(409, { message: "Username already exists", data: null });
      }
      return makeResponse(400, { message: "Invalid register", data: { error: e.message } });
    }
  }

  _login(req) {
    var body = req.body || {};
    var username = (body.username || "").trim();
    var password = (body.password || "").trim();

    if (!username || !password) {
      return makeResponse(400, { message: "username/password required", data: null });
    }

    var user = UsersApiDB.getUserByUsername(username);
    if (!user || user.password !== password) {
      return makeResponse(401, { message: "Invalid credentials", data: null });
    }

    var session = this.sessions.createSession(user.id);
    return makeResponse(200, {
      message: "Logged in",
      data: { userId: user.id, token: session.token }
    });
  }

  _logout(req) {
    var token = this._getBearerToken(req.headers);
    if (!token) return makeResponse(401, { message: "Missing token", data: null });

    var ok = this.sessions.deleteSession(token);
    if (!ok) return makeResponse(401, { message: "Invalid token", data: null });

    return makeResponse(200, { message: "Logged out", data: null });
  }

  _getBearerToken(headers) {
    headers = headers || {};
    var auth = headers["Authorization"] || headers["authorization"] || "";
    if (!auth) return null;

    var parts = auth.split(" ");
    if (parts.length === 2 && parts[0] === "Bearer") return parts[1];
    return null;
  }
}
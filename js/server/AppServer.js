// js/server/AppServer.js
class AppServer {
  constructor() {
    this.sessions = new SessionStore();
  }

  handle(req) {
    try {
      if (!req || !req.method || !req.path) {
        return makeResponse(400, { message: "Bad request", data: null });
      }

      // Authorization חובה לכל דבר כאן
      var auth = this._authorize(req);
      if (!auth.ok) return auth.res;

      var userId = auth.userId;
      var method = String(req.method).toUpperCase();
      var path = req.path;

      if (method === "GET" && path === "/tasks") return this._listTasks(req, userId);
      if (method === "POST" && path === "/tasks") return this._createTask(req, userId);

      var taskId = this._extractTaskId(path);
      if (taskId) {
        if (method === "GET") return this._getTask(userId, taskId);
        if (method === "PUT") return this._updateTask(req, userId, taskId);
        if (method === "DELETE") return this._deleteTask(userId, taskId);
      }

      return makeResponse(404, { message: "Route not found", data: null });
    } catch (e) {
      return makeResponse(500, { message: "Server error", data: { error: e.message } });
    }
  }

  _authorize(req) {
    var token = this._getBearerToken(req.headers);
    if (!token) {
      return { ok: false, res: makeResponse(401, { message: "Missing token", data: null }) };
    }

    var session = this.sessions.getSession(token);
    if (!session) {
      return { ok: false, res: makeResponse(401, { message: "Invalid token", data: null }) };
    }

    return { ok: true, userId: session.userId };
  }

  _listTasks(req, userId) {
    var q = (req.query && req.query.search) ? String(req.query.search) : "";
    var tasks = q ? TasksApiDB.search(userId, q) : TasksApiDB.list(userId);
    return makeResponse(200, { message: "OK", data: tasks });
  }

  _createTask(req, userId) {
    var body = req.body || {};
    var title = (body.title || "").trim();
    if (!title) return makeResponse(400, { message: "title required", data: null });

    var task = TasksApiDB.create(userId, {
      title: title,
      details: body.details || "",
      done: Boolean(body.done),
      priority: body.priority || "med",
      dueDate: body.dueDate || null
    });

    return makeResponse(201, { message: "Created", data: task });
  }

  _getTask(userId, taskId) {
    var task = TasksApiDB.get(userId, taskId);
    if (!task) return makeResponse(404, { message: "Not found", data: null });
    return makeResponse(200, { message: "OK", data: task });
  }

  _updateTask(req, userId, taskId) {
    var patch = req.body || {};
    var updated = TasksApiDB.update(userId, taskId, patch);
    if (!updated) return makeResponse(404, { message: "Not found", data: null });
    return makeResponse(200, { message: "Updated", data: updated });
  }

  _deleteTask(userId, taskId) {
    TasksApiDB.delete(userId, taskId);
    return makeResponse(200, { message: "Deleted", data: { deletedId: taskId } });
  }

  _extractTaskId(path) {
    if (path.indexOf("/tasks/") !== 0) return null;
    var parts = path.split("/");
    if (parts.length === 3 && parts[2]) return parts[2];
    return null;
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
class SessionStore {
  constructor() {
    this.STORAGE_KEY = "sessions_db"; // token -> { token, userId, createdAt }
  }

  _getAll() {
    var raw = sessionStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  }

  _saveAll(list) {
    sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
  }

  _genToken() {
    return "t_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  }

  createSession(userId) {
    var sessions = this._getAll();
    var token = this._genToken();

    var session = {
      token: token,
      userId: userId,
      createdAt: Date.now()
    };

    sessions.push(session);
    this._saveAll(sessions);

    return session; // {token,userId,...}
  }

  getSession(token) {
    if (!token) return null;
    var sessions = this._getAll();
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].token === token) return sessions[i];
    }
    return null;
  }

  deleteSession(token) {
    var sessions = this._getAll();
    var next = [];
    var deleted = false;

    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].token === token) {
        deleted = true;
      } else {
        next.push(sessions[i]);
      }
    }

    this._saveAll(next);
    return deleted;
  }

  clearAll() {
    this._saveAll([]);
  }
}
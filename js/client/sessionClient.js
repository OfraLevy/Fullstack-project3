class SessionClient {
  constructor() {
    this.KEY = "current_session"; // { token, userId }
  }

  set(session) {
    localStorage.setItem(this.KEY, JSON.stringify(session));
  }

  get() {
    var raw = localStorage.getItem(this.KEY);
    return raw ? JSON.parse(raw) : null;
  }

  getToken() {
    var s = this.get();
    return s && s.token ? s.token : null;
  }

  getUserId() {
    var s = this.get();
    return s && s.userId ? s.userId : null;
  }

  clear() {
    localStorage.removeItem(this.KEY);
  }
}
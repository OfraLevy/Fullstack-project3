class AuthClient {
  constructor() {
    this.api = new FajaxClient();
    this.session = new SessionClient();
  }

  register(username, password, cb) {
    this.api.request("POST", "http://auth/register", { username: username, password: password }, cb);
  }

  login(username, password, cb) {
    var self = this;
    this.api.request("POST", "http://auth/login", { username: username, password: password }, function (err, res) {
      if (err) return cb(err, null);

      // אם הצלחה נשמור session
      if (res.status >= 200 && res.status < 300 && res.body && res.body.data) {
        self.session.set({ token: res.body.data.token, userId: res.body.data.userId });
      }
      cb(null, res);
    });
  }

  logout(cb) {
    var self = this;
    this.api.request("POST", "http://auth/logout", {}, function (err, res) {
      self.session.clear();
      cb(err, res);
    });
  }
}
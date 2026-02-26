class AuthClient {
  constructor() {
    this.api = new FajaxClient();
    this.session = new SessionClient();
  }

  register(username, password, callback) {
    this.api.request("POST", "http://auth/register", { username: username, password: password }, cb);
  }

  login(username, password, callback) {
    var self = this;
    this.api.request("POST", "http://auth/login", { username: username, password: password }, function (err, res) {
      if (err) return callback(err, null);

      if (res.status >= 200 && res.status < 300 && res.body && res.body.data) {
        self.session.set({ token: res.body.data.token, userId: res.body.data.userId });
      }
      callback(null, res);
    });
  }

  logout(callback) {
    var self = this;
    this.api.request("POST", "http://auth/logout", {}, function (err, res) {
      self.session.clear();
      callback(err, res);
    });
  }
}
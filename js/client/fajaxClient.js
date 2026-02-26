class FajaxClient {
  constructor() {
    this.session = new SessionClient();
  }

  request(method, url, body, cb) {
    var xhr = new FXMLHttpRequest();
    xhr.open(method, url);

    // JSON header כשיש body
    if (body !== null && body !== undefined) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }

    // Authorization אם יש token
    var token = this.session.getToken();
    if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);

    xhr.onload = function () {
      var parsed = null;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch (e) {
        return cb(new Error("Bad JSON response"), null);
      }
      cb(null, { status: xhr.status, body: parsed });
    };

    xhr.onerror = function () {
      cb(new Error("Network error (drop/timeout)"), null);
    };

    xhr.send(body);
  }
}
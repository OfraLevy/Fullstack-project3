class FajaxClient {
  constructor() {
    this.session = new SessionClient();
  }

  request(method, url, body, callback) {
    this._requestInternal(method, url, body, callback, 0);
  }

  _requestInternal(method, url, body, callback, attempt) {
    var xhr = new FXMLHttpRequest();
    xhr.open(method, url);

    if (body !== null && body !== undefined) {
      xhr.setRequestHeader("Content-Type", "application/json");
    }

    var token = this.session.getToken();
    if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);

    var self = this;

    xhr.onload = function () {
      var parsed = null;
      try {
        parsed = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch (e) {
        return callback(new Error("Bad JSON response"), null);
      }
      callback(null, { status: xhr.status, body: parsed });
    };

    xhr.onerror = function () {
      // Retry only for GET (safe), up to 2 retries
      if (String(method).toUpperCase() === "GET" && attempt < 2) {
        setTimeout(function () {
          self._requestInternal(method, url, body, callback, attempt + 1);
        }, 350);
        return;
      }
      callback(new Error("Network error (drop)"), null);
    };

    xhr.send(body);
  }
}
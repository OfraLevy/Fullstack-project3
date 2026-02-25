// js/fajax/FXMLHttpRequest.js
class FXMLHttpRequest {
  constructor() {
    this.readyState = 0; // 0 UNSENT, 1 OPENED, 2 HEADERS_RECEIVED, 3 LOADING, 4 DONE
    this.status = 0;
    this.responseText = "";

    this.onreadystatechange = null;
    this.onload = null;
    this.onerror = null;

    this._method = null;
    this._url = null;
    this._headers = {};

    this._network = FXMLHttpRequest._getNetworkSingleton();
  }

  static _getNetworkSingleton() {
    if (!FXMLHttpRequestSingleton.instance) {
      FXMLHttpRequestSingleton.instance = new Network();
    }
    return FXMLHttpRequestSingleton.instance;
  }

  open(method, url) {
    this._method = String(method || "GET").toUpperCase();
    this._url = String(url || "");
    this.readyState = 1;
    this._fireReadyStateChange();
  }

  setRequestHeader(name, value) {
    this._headers[String(name)] = String(value);
  }

  send(body) {
    var self = this;

    if (this.readyState !== 1) {
      throw new Error("InvalidStateError: call open() before send()");
    }

    // HEADERS_RECEIVED
    this.readyState = 2;
    this._fireReadyStateChange();

    var req = {
      method: this._method,
      url: this._url,
      headers: this._headers,
      body: body ? body : null,
      path: null,
      query: null
    };

    this._network.send(
      req,
      function onSuccess(res) {
        // LOADING
        self.readyState = 3;
        self._fireReadyStateChange();

        self.status = res.status;
        self.responseText = JSON.stringify(res.body);

        // DONE
        self.readyState = 4;
        self._fireReadyStateChange();

        if (typeof self.onload === "function") self.onload();
      },
      function onError(err) {
        self.status = 0;
        self.responseText = "";

        self.readyState = 4;
        self._fireReadyStateChange();

        if (typeof self.onerror === "function") self.onerror(err);
      }
    );
  }

  _fireReadyStateChange() {
    if (typeof this.onreadystatechange === "function") {
      this.onreadystatechange();
    }
  }
}

var FXMLHttpRequestSingleton = { instance: null };
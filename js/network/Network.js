// js/network/Network.js
class Network {
  constructor() {
    this.config = new NetworkConfig();
    this.router = new ServerRouter();
  }

  // onSuccess(response), onError(error)
  send(request, onSuccess, onError) {
    var self = this;
    var delay = self.config.randomDelay();

    setTimeout(function () {
      // random drop
      if (self.config.shouldDrop()) {
        if (typeof onError === "function") onError(new Error("Network drop"));
        return;
      }

      // route the request and get response
      var response = self.router.route(request);

      if (typeof onSuccess === "function") onSuccess(response);
    }, delay);
  }
}
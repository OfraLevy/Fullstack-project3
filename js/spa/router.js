class Router {
  constructor() {
    this.routes = {}; // "#/login" -> function
  }

  register(hash, renderFn) {
    this.routes[hash] = renderFn;
  }

  go(hash) {
    window.location.hash = hash;
  }

  resolve(root) {
    var h = window.location.hash || "#/login";
    var fn = this.routes[h];
    if (fn) fn(root);
    else this.go("#/login");
  }
}
class LoginView {
  constructor(router) {
    this.router = router;
    this.auth = new AuthClient();
  }

  render(root) {
    root.innerHTML = `
      <h2>Login</h2>
      <input id="u" placeholder="username" />
      <input id="p" placeholder="password" type="password" />
      <button id="loginBtn">Login</button>
      <p><a href="#/register">Create account</a></p>
      <div id="msg"></div>
    `;

    var self = this;
    root.querySelector("#loginBtn").onclick = function () {
      var u = root.querySelector("#u").value.trim();
      var p = root.querySelector("#p").value.trim();
      root.querySelector("#msg").textContent = "Loading...";

      self.auth.login(u, p, function (err, res) {
        if (err) return (root.querySelector("#msg").textContent = err.message);
        if (!res || res.status >= 400) return (root.querySelector("#msg").textContent = (res.body && res.body.message) || "Login failed");

        self.router.go("#/tasks");
      });
    };
  }
}
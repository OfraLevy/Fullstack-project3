class LoginView {
  constructor(router) {
    this.router = router;
    this.auth = new AuthClient();
  }

  render(root) {
    root.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="brand">
            <h1>Task Manager</h1>
            <p>Login to continue</p>
          </div>
          <span class="pill">Fake Network • Fake AJAX</span>
        </div>

        <div class="card-body">
          <div class="grid">
            <div class="field">
              <div class="label">Username</div>
              <input class="input" id="u" placeholder="username" />
            </div>
            <div class="field">
              <div class="label">Password</div>
              <input class="input" id="p" placeholder="password" type="password" />
            </div>
          </div>

          <div style="height:12px"></div>

          <div class="row">
            <button class="btn primary" id="loginBtn">Login</button>
            <a href="#/register">Create account</a>
          </div>

          <div id="msg" class="toast muted" style="display:none"></div>
        </div>
      </div>
    `;

    var self = this;

    function setMsg(type, text){
      var box = root.querySelector("#msg");
      if (!text) { box.style.display="none"; return; }
      box.style.display="block";
      box.className = "toast " + (type || "muted");
      box.textContent = text;
    }

    root.querySelector("#loginBtn").onclick = function () {
      var btn = root.querySelector("#loginBtn");
      var u = root.querySelector("#u").value.trim();
      var p = root.querySelector("#p").value.trim();

      btn.disabled = true;
      setMsg("muted", "Logging in...");

      self.auth.login(u, p, function (err, res) {
        btn.disabled = false;

        if (err) return setMsg("bad", err.message);
        if (!res || res.status >= 400) return setMsg("bad", (res.body && res.body.message) || "Login failed");

        setMsg("good", "Success");
        self.router.go("#/tasks");
      });
    };
  }
}
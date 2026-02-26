class LoginView {
  constructor(router) {
    this.router = router;
    this.auth = new AuthClient();
  }

  render(root) {
    var tpl = document.getElementById("tpl-login");
    root.innerHTML = "";
    root.appendChild(tpl.content.cloneNode(true));
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
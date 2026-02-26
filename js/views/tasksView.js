class TasksView {
  constructor(router) {
    this.router = router;
    this.tasks = new TasksClient();
    this.auth = new AuthClient();
    this.session = new SessionClient();
  }

  render(root) {
    if (!this.session.getToken()) {
      this.router.go("#/login");
      return;
    }

    root.innerHTML = `
      <h2>Tasks</h2>
      <button id="logoutBtn">Logout</button>

      <div style="margin-top:10px;">
        <input id="title" placeholder="New task title" />
        <button id="addBtn">Add</button>
      </div>

      <div style="margin-top:10px;">
        <input id="search" placeholder="Search..." />
        <button id="searchBtn">Search</button>
        <button id="refreshBtn">Refresh</button>
      </div>

      <div id="msg" style="margin-top:10px;"></div>
      <ul id="list"></ul>
    `;

    var self = this;

    root.querySelector("#logoutBtn").onclick = function () {
      self.auth.logout(function () {
        self.router.go("#/login");
      });
    };

    root.querySelector("#addBtn").onclick = function () {
      var t = root.querySelector("#title").value.trim();
      if (!t) return;
      root.querySelector("#msg").textContent = "Adding...";

      self.tasks.create({ title: t }, function (err) {
        if (err) return (root.querySelector("#msg").textContent = err.message);
        root.querySelector("#title").value = "";
        self._load(root);
      });
    };

    root.querySelector("#refreshBtn").onclick = function () {
      self._load(root);
    };

    root.querySelector("#searchBtn").onclick = function () {
      var q = root.querySelector("#search").value.trim();
      if (!q) return self._load(root);
      root.querySelector("#msg").textContent = "Searching...";
      self.tasks.search(q, function (err, res) {
        if (err) return (root.querySelector("#msg").textContent = err.message);
        self._renderList(root, (res.body && res.body.data) || []);
      });
    };

    this._load(root);
  }

  _load(root) {
    var self = this;
    root.querySelector("#msg").textContent = "Loading...";
    this.tasks.list(function (err, res) {
      if (err) return (root.querySelector("#msg").textContent = err.message);
      if (res.status >= 400) return (root.querySelector("#msg").textContent = (res.body && res.body.message) || "Error");
      self._renderList(root, (res.body && res.body.data) || []);
    });
  }

  _renderList(root, tasks) {
    var self = this;
    var ul = root.querySelector("#list");
    ul.innerHTML = "";
    root.querySelector("#msg").textContent = "";

    for (var i = 0; i < tasks.length; i++) {
      (function (task) {
        var li = document.createElement("li");
        li.innerHTML = `
          <span style="margin-right:8px;">${task.done ? "✅" : "⬜"} ${task.title}</span>
          <button data-act="toggle">Toggle</button>
          <button data-act="del">Delete</button>
        `;

        li.querySelector('[data-act="toggle"]').onclick = function () {
          self.tasks.update(task.id, { done: !task.done }, function (err) {
            if (err) return alert(err.message);
            self._load(root);
          });
        };

        li.querySelector('[data-act="del"]').onclick = function () {
          self.tasks.remove(task.id, function (err) {
            if (err) return alert(err.message);
            self._load(root);
          });
        };

        ul.appendChild(li);
      })(tasks[i]);
    }
  }
}
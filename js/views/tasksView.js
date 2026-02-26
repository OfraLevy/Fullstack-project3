// js/views/tasksView.js
class TasksView {
  constructor(router) {
    this.router = router;
    this.tasks = new TasksClient();
    this.auth = new AuthClient();
    this.session = new SessionClient();

    // Race-control for GETs
    this._getSeq = 0;
    this._activeGetSeq = 0;

    // Fine-grained locks
    this._locks = {
      list: false,       // for refresh/search/list only
      create: false,     // add button
      row: {}            // per task id: {toggle:true, del:true}
    };
  }

  render(root) {
    if (!this.session.getToken()) {
      this.router.go("#/login");
      return;
    }

    root.innerHTML = `
      <div class="card">
        <div class="card-header">
          <div class="brand">
            <h1>Task Manager</h1>
            <p>Your tasks, synced via Fake-AJAX + Network</p>
          </div>

          <div class="row">
            <span class="pill" id="netState"><span class="spinner" style="display:none"></span><span>Ready</span></span>
            <button class="btn" id="logoutBtn">Logout</button>
          </div>
        </div>

        <div class="card-body">
          <div class="grid">
            <div class="field">
              <div class="label">New task title</div>
              <input class="input" id="title" placeholder="e.g. Finish UI" />
            </div>
            <div class="row" style="align-items:flex-end;">
              <button class="btn primary" id="addBtn">Add</button>
              <span class="pill" id="addHint">Add is per-action locked</span>
            </div>
          </div>

          <div style="height:12px"></div>

          <div class="row">
            <input class="input" style="flex:1" id="search" placeholder="Search..." />
            <button class="btn" id="searchBtn">Search</button>
            <button class="btn" id="refreshBtn">Refresh</button>
          </div>

          <div id="msg" class="toast muted" style="display:none"></div>

          <table class="table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    var self = this;

    root.querySelector("#logoutBtn").onclick = function () {
      self._setNetState(root, true, "Logging out...");
      self.auth.logout(function () {
        self._setNetState(root, false, "Ready");
        self.router.go("#/login");
      });
    };

    root.querySelector("#addBtn").onclick = function () {
      self._onCreate(root);
    };

    root.querySelector("#refreshBtn").onclick = function () {
      self._loadList(root);
    };

    root.querySelector("#searchBtn").onclick = function () {
      var q = root.querySelector("#search").value.trim();
      if (!q) return self._loadList(root);
      self._loadSearch(root, q);
    };

    // initial
    this._loadList(root);
  }

  // ---------- UI helpers ----------
  _showMsg(root, type, text) {
    var box = root.querySelector("#msg");
    if (!text) {
      box.style.display = "none";
      return;
    }
    box.style.display = "block";
    box.className = "toast " + (type || "muted");
    box.textContent = text;
  }

  _setNetState(root, loading, text) {
    var pill = root.querySelector("#netState");
    var sp = pill.querySelector(".spinner");
    var label = pill.querySelector("span:last-child");
    sp.style.display = loading ? "inline-block" : "none";
    label.textContent = text || (loading ? "Loading..." : "Ready");
  }

  _setListLock(root, locked) {
    this._locks.list = locked;
    root.querySelector("#searchBtn").disabled = locked;
    root.querySelector("#refreshBtn").disabled = locked;
  }

  _setCreateLock(root, locked) {
    this._locks.create = locked;
    root.querySelector("#addBtn").disabled = locked;
  }

  _ensureRowLock(taskId) {
    if (!this._locks.row[taskId]) this._locks.row[taskId] = { toggle: false, del: false };
  }

  // ---------- Race-safe GETs ----------
  _startGet(root, label) {
    this._getSeq += 1;
    this._activeGetSeq = this._getSeq;
    this._setListLock(root, true);
    this._setNetState(root, true, label || "Loading...");
    return this._activeGetSeq;
  }

  _finishGetIfCurrent(root, seq, labelAfter) {
    // only the latest GET is allowed to update UI state
    if (seq !== this._activeGetSeq) return false;

    this._setListLock(root, false);
    this._setNetState(root, false, labelAfter || "Ready");
    return true;
  }

  _loadList(root) {
    var self = this;
    var seq = this._startGet(root, "Loading tasks...");
    this._showMsg(root, "muted", "Fetching list...");

    this.tasks.list(function (err, res) {
      // ignore stale response (race condition handling)
      if (seq !== self._activeGetSeq) return;

      if (err) {
        self._finishGetIfCurrent(root, seq, "Ready");
        self._showMsg(root, "bad", err.message);
        return;
      }
      if (res.status >= 400) {
        self._finishGetIfCurrent(root, seq, "Ready");
        self._showMsg(root, "bad", (res.body && res.body.message) || "Error");
        return;
      }

      var tasks = (res.body && res.body.data) ? res.body.data : [];
      self._renderList(root, tasks);
      self._finishGetIfCurrent(root, seq, "Ready");
      self._showMsg(root, "good", "List updated (" + tasks.length + ")");
      setTimeout(function(){ self._showMsg(root, "", ""); }, 900);
    });
  }

  _loadSearch(root, q) {
    var self = this;
    var seq = this._startGet(root, "Searching...");
    this._showMsg(root, "muted", "Searching for: " + q);

    this.tasks.search(q, function (err, res) {
      if (seq !== self._activeGetSeq) return;

      if (err) {
        self._finishGetIfCurrent(root, seq, "Ready");
        self._showMsg(root, "bad", err.message);
        return;
      }
      if (res.status >= 400) {
        self._finishGetIfCurrent(root, seq, "Ready");
        self._showMsg(root, "bad", (res.body && res.body.message) || "Error");
        return;
      }

      var tasks = (res.body && res.body.data) ? res.body.data : [];
      self._renderList(root, tasks);
      self._finishGetIfCurrent(root, seq, "Ready");
      self._showMsg(root, "good", "Search results (" + tasks.length + ")");
      setTimeout(function(){ self._showMsg(root, "", ""); }, 900);
    });
  }

  // ---------- Mutations with fine-grained locks ----------
  _onCreate(root) {
    var self = this;
    if (this._locks.create) return;

    var title = root.querySelector("#title").value.trim();
    if (!title) {
      this._showMsg(root, "bad", "Title is required");
      return;
    }

    this._setCreateLock(root, true);
    this._setNetState(root, true, "Creating task...");
    this._showMsg(root, "muted", "Creating...");

    this.tasks.create({ title: title }, function (err, res) {
      self._setCreateLock(root, false);
      self._setNetState(root, false, "Ready");

      if (err) return self._showMsg(root, "bad", err.message);
      if (res.status >= 400) return self._showMsg(root, "bad", (res.body && res.body.message) || "Create failed");

      root.querySelector("#title").value = "";
      self._showMsg(root, "good", "Created");
      // reload list (race-safe)
      self._loadList(root);
    });
  }

  _onToggle(root, task) {
    var self = this;
    this._ensureRowLock(task.id);
    if (this._locks.row[task.id].toggle) return;

    this._locks.row[task.id].toggle = true;
    this._renderRowDisabledState(root, task.id);

    this.tasks.update(task.id, { done: !task.done }, function (err, res) {
      self._locks.row[task.id].toggle = false;
      self._renderRowDisabledState(root, task.id);

      if (err) return self._showMsg(root, "bad", err.message);
      if (res.status >= 400) return self._showMsg(root, "bad", (res.body && res.body.message) || "Update failed");

      self._showMsg(root, "good", "Updated");
      self._loadList(root);
    });
  }

  _onDelete(root, task) {
    var self = this;
    this._ensureRowLock(task.id);
    if (this._locks.row[task.id].del) return;

    this._locks.row[task.id].del = true;
    this._renderRowDisabledState(root, task.id);

    this.tasks.remove(task.id, function (err, res) {
      self._locks.row[task.id].del = false;
      self._renderRowDisabledState(root, task.id);

      if (err) return self._showMsg(root, "bad", err.message);
      if (res.status >= 400) return self._showMsg(root, "bad", (res.body && res.body.message) || "Delete failed");

      self._showMsg(root, "good", "Deleted");
      self._loadList(root);
    });
  }

  _renderRowDisabledState(root, taskId) {
    var row = root.querySelector('tr[data-id="' + taskId + '"]');
    if (!row) return;

    var toggleBtn = row.querySelector('[data-act="toggle"]');
    var delBtn = row.querySelector('[data-act="del"]');

    this._ensureRowLock(taskId);
    toggleBtn.disabled = this._locks.row[taskId].toggle;
    delBtn.disabled = this._locks.row[taskId].del;
  }

  // ---------- Render ----------
  _renderList(root, tasks) {
    var tbody = root.querySelector("#tbody");
    tbody.innerHTML = "";

    var self = this;
    for (var i = 0; i < tasks.length; i++) {
      (function (task) {
        var tr = document.createElement("tr");
        tr.setAttribute("data-id", task.id);

        var statusHtml = task.done
          ? '<span class="badge done">Done</span>'
          : '<span class="badge todo">Todo</span>';

        tr.innerHTML = `
          <td>${statusHtml}</td>
          <td>${this._escape(task.title)}</td>
          <td>
            <div class="row">
              <button class="btn success" data-act="toggle">${task.done ? "Undo" : "Done"}</button>
              <button class="btn danger" data-act="del">Delete</button>
            </div>
          </td>
        `;

        tr.querySelector('[data-act="toggle"]').onclick = function () { self._onToggle(root, task); };
        tr.querySelector('[data-act="del"]').onclick = function () { self._onDelete(root, task); };

        tbody.appendChild(tr);

        // apply locks if exist
        self._renderRowDisabledState(root, task.id);
      }).call(this, tasks[i]);
    }
  }

  _escape(s) {
    s = String(s == null ? "" : s);
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
}
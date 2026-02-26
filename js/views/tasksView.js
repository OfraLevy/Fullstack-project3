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

    // Fine-grained locks + edit state
    this._locks = {
      list: false,
      create: false,
      row: {} // per task id: {toggle, del, edit, save}
    };

    this._editing = {
      id: null,
      title: "",
      priority: "med"
    };
  }

  render(root) {
    if (!this.session.getToken()) {
      this.router.go("#/login");
      return;
    }

    var tpl = document.getElementById("tpl-tasks");
    root.innerHTML = "";
    root.appendChild(tpl.content.cloneNode(true));

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
    if (!this._locks.row[taskId]) {
      this._locks.row[taskId] = { toggle: false, del: false, edit: false, save: false };
    }
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

  // ---------- Create ----------
  _onCreate(root) {
    var self = this;
    if (this._locks.create) return;

    var title = root.querySelector("#title").value.trim();
    var prio = root.querySelector("#prio").value || "med";

    if (!title) {
      this._showMsg(root, "bad", "Title is required");
      return;
    }

    this._setCreateLock(root, true);
    this._setNetState(root, true, "Creating task...");
    this._showMsg(root, "muted", "Creating...");

    this.tasks.create({ title: title, priority: prio }, function (err, res) {
      self._setCreateLock(root, false);
      self._setNetState(root, false, "Ready");

      if (err) return self._showMsg(root, "bad", err.message);
      if (res.status >= 400) return self._showMsg(root, "bad", (res.body && res.body.message) || "Create failed");

      root.querySelector("#title").value = "";
      root.querySelector("#prio").value = "med";
      self._showMsg(root, "good", "Created");
      self._loadList(root);
    });
  }

  // ---------- Edit flow ----------
  _startEdit(root, task) {
    // allow only one row in edit at a time (keeps UI simple + avoids races)
    this._editing.id = task.id;
    this._editing.title = task.title || "";
    this._editing.priority = task.priority || "med";
    this._loadList(root); // re-render will show edit row
  }

  _cancelEdit(root) {
    this._editing.id = null;
    this._editing.title = "";
    this._editing.priority = "med";
    this._loadList(root);
  }

  _saveEdit(root, taskId) {
    var self = this;
    this._ensureRowLock(taskId);
    if (this._locks.row[taskId].save) return;

    var row = root.querySelector('tr[data-id="' + taskId + '"]');
    if (!row) return;

    var newTitle = row.querySelector('input[data-edit="title"]').value.trim();
    var newPrio = row.querySelector('select[data-edit="prio"]').value;

    if (!newTitle) {
      this._showMsg(root, "bad", "Title is required");
      return;
    }

    this._locks.row[taskId].save = true;
    this._renderRowDisabledState(root, taskId);

    this.tasks.update(taskId, { title: newTitle, priority: newPrio }, function (err, res) {
      self._locks.row[taskId].save = false;

      if (err) {
        self._renderRowDisabledState(root, taskId);
        return self._showMsg(root, "bad", err.message);
      }
      if (res.status >= 400) {
        self._renderRowDisabledState(root, taskId);
        return self._showMsg(root, "bad", (res.body && res.body.message) || "Update failed");
      }

      self._showMsg(root, "good", "Updated");
      self._editing.id = null;
      self._loadList(root);
    });
  }

  // ---------- Mutations ----------
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

      // if deleted row was in edit mode – exit edit
      if (self._editing.id === task.id) self._editing.id = null;

      self._loadList(root);
    });
  }

  _renderRowDisabledState(root, taskId) {
    var row = root.querySelector('tr[data-id="' + taskId + '"]');
    if (!row) return;

    this._ensureRowLock(taskId);

    var toggleBtn = row.querySelector('[data-act="toggle"]');
    var delBtn = row.querySelector('[data-act="del"]');
    var editBtn = row.querySelector('[data-act="edit"]');
    var saveBtn = row.querySelector('[data-act="save"]');
    var cancelBtn = row.querySelector('[data-act="cancel"]');

    if (toggleBtn) toggleBtn.disabled = this._locks.row[taskId].toggle || this._locks.row[taskId].save;
    if (delBtn) delBtn.disabled = this._locks.row[taskId].del || this._locks.row[taskId].save;
    if (editBtn) editBtn.disabled = (this._editing.id && this._editing.id !== taskId) || this._locks.row[taskId].save;
    if (saveBtn) saveBtn.disabled = this._locks.row[taskId].save;
    if (cancelBtn) cancelBtn.disabled = this._locks.row[taskId].save;
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

        var pr = (task.priority || "med");
        var prText = pr === "high" ? "High" : (pr === "low" ? "Low" : "Medium");
        var prClass = pr === "high" ? "prio-high" : (pr === "low" ? "prio-low" : "prio-med");
        var prHtml = '<span class="badge ' + prClass + '">' + prText + "</span>";

        // edit row?
        if (self._editing.id === task.id) {
          tr.innerHTML = `
            <td>${statusHtml}</td>
            <td>
              <select class="input" data-edit="prio" style="max-width:160px">
                <option value="low">Low</option>
                <option value="med">Medium</option>
                <option value="high">High</option>
              </select>
            </td>
            <td>
              <input class="input" data-edit="title" value="${self._escape(self._editing.title)}" />
            </td>
            <td>
              <div class="row">
                <button class="btn primary" data-act="save">Save</button>
                <button class="btn" data-act="cancel">Cancel</button>
              </div>
            </td>
          `;

          // set current priority in select
          tr.querySelector('select[data-edit="prio"]').value = self._editing.priority || "med";

          tr.querySelector('[data-act="save"]').onclick = function () { self._saveEdit(root, task.id); };
          tr.querySelector('[data-act="cancel"]').onclick = function () { self._cancelEdit(root); };

          tbody.appendChild(tr);
          self._renderRowDisabledState(root, task.id);
          return;
        }

        // normal row
        tr.innerHTML = `
          <td>${statusHtml}</td>
          <td>${prHtml}</td>
          <td>${self._escape(task.title)}</td>
          <td>
            <div class="row">
              <button class="btn success" data-act="toggle">${task.done ? "Undo" : "Done"}</button>
              <button class="btn" data-act="edit">Edit</button>
              <button class="btn danger" data-act="del">Delete</button>
            </div>
          </td>
        `;

        tr.querySelector('[data-act="toggle"]').onclick = function () { self._onToggle(root, task); };
        tr.querySelector('[data-act="del"]').onclick = function () { self._onDelete(root, task); };
        tr.querySelector('[data-act="edit"]').onclick = function () { self._startEdit(root, task); };

        tbody.appendChild(tr);
        self._renderRowDisabledState(root, task.id);
      })(tasks[i]);
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
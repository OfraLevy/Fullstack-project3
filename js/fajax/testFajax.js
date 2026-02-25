// js/fajax/testFajax.js
localStorage.clear();

function post(url, body, token, cb) {
  var xhr = new FXMLHttpRequest();
  xhr.open("POST", url);
  xhr.setRequestHeader("Content-Type", "application/json");
  if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);

  xhr.onload = function () {
    cb(null, { status: xhr.status, body: JSON.parse(xhr.responseText) });
  };
  xhr.onerror = function (e) {
    cb(e || new Error("Network error"), null);
  };

  xhr.send(body);
}

function get(url, token, cb) {
  var xhr = new FXMLHttpRequest();
  xhr.open("GET", url);
  if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);

  xhr.onload = function () {
    cb(null, { status: xhr.status, body: JSON.parse(xhr.responseText) });
  };
  xhr.onerror = function (e) {
    cb(e || new Error("Network error"), null);
  };

  xhr.send(null);
}

function put(url, body, token, cb) {
  var xhr = new FXMLHttpRequest();
  xhr.open("PUT", url);
  xhr.setRequestHeader("Content-Type", "application/json");
  if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);

  xhr.onload = function () {
    cb(null, { status: xhr.status, body: JSON.parse(xhr.responseText) });
  };
  xhr.onerror = function (e) {
    cb(e || new Error("Network error"), null);
  };

  xhr.send(body);
}

function del(url, token, cb) {
  var xhr = new FXMLHttpRequest();
  xhr.open("DELETE", url);
  if (token) xhr.setRequestHeader("Authorization", "Bearer " + token);

  xhr.onload = function () {
    cb(null, { status: xhr.status, body: JSON.parse(xhr.responseText) });
  };
  xhr.onerror = function (e) {
    cb(e || new Error("Network error"), null);
  };

  xhr.send(null);
}

function logStep(name, err, res) {
  if (err) {
    console.log(name + " ERROR:", err);
  } else {
    console.log(name + " OK:", res);
  }
}

// זרימה מלאה: register -> login -> create -> list -> update -> get -> delete -> get(404) -> list
post("http://auth/register", { username: "aaa", password: "1111" }, null, function (err, res) {
  logStep("REGISTER", err, res);

  post("http://auth/login", { username: "aaa", password: "1111" }, null, function (err2, res2) {
    logStep("LOGIN", err2, res2);
    if (err2 || !res2 || !res2.body || !res2.body.data) return;

    var token = res2.body.data.token;

    post("http://app/tasks", { title: "Task 1", priority: "high" }, token, function (err3, res3) {
      logStep("CREATE", err3, res3);
      if (err3 || !res3 || !res3.body || !res3.body.data) return;

      var taskId = res3.body.data.id;

      get("http://app/tasks", token, function (err4, res4) {
        logStep("LIST", err4, res4);

        // UPDATE (PUT)
        put("http://app/tasks/" + taskId, { done: true, title: "Task 1 UPDATED" }, token, function (err5, res5) {
          logStep("UPDATE", err5, res5);

          // GET single
          get("http://app/tasks/" + taskId, token, function (err6, res6) {
            logStep("GET ONE", err6, res6);

            // DELETE
            del("http://app/tasks/" + taskId, token, function (err7, res7) {
              logStep("DELETE", err7, res7);

              // GET after delete (should be 404)
              get("http://app/tasks/" + taskId, token, function (err8, res8) {
                logStep("GET AFTER DELETE (expect 404)", err8, res8);

                // LIST after delete
                get("http://app/tasks", token, function (err9, res9) {
                  logStep("LIST AFTER DELETE", err9, res9);
                });
              });
            });
          });
        });
      });
    });
  });
});
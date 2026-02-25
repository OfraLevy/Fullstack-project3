// js/server/testServers.js
try {
  localStorage.clear();

  var auth = new AuthServer();
  var app = new AppServer();

  var registerRes = auth.handle({
    method: "POST",
    path: "/register",
    headers: {},
    body: { username: "aaa", password: "1111" }
  });
  console.log("REGISTER:", registerRes);

  var loginRes = auth.handle({
    method: "POST",
    path: "/login",
    headers: {},
    body: { username: "aaa", password: "1111" }
  });
  console.log("LOGIN:", loginRes);

  var token = loginRes.body && loginRes.body.data && loginRes.body.data.token;

  var createRes = app.handle({
    method: "POST",
    path: "/tasks",
    headers: { Authorization: "Bearer " + token },
    body: { title: "Task 1", priority: "high" }
  });
  console.log("CREATE TASK:", createRes);

  var listRes = app.handle({
    method: "GET",
    path: "/tasks",
    headers: { Authorization: "Bearer " + token },
    query: {}
  });
  console.log("LIST:", listRes);

  var logoutRes = auth.handle({
    method: "POST",
    path: "/logout",
    headers: { Authorization: "Bearer " + token },
    body: {}
  });
  console.log("LOGOUT:", logoutRes);

  var listFailRes = app.handle({
    method: "GET",
    path: "/tasks",
    headers: { Authorization: "Bearer " + token }
  });
  console.log("LIST (should fail):", listFailRes);
} catch (e) {
  console.error("SERVER TEST FAILED:", e.message, e);
}
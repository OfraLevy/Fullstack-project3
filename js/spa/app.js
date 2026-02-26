(function () {
  var root = document.getElementById("app");
  var router = new Router();

  var loginView = new LoginView(router);
  var registerView = new RegisterView(router);
  var tasksView = new TasksView(router);

  router.register("#/login", function (r) { loginView.render(r); });
  router.register("#/register", function (r) { registerView.render(r); });
  router.register("#/tasks", function (r) { tasksView.render(r); });

  window.addEventListener("hashchange", function () {
    router.resolve(root);
  });

  router.resolve(root);
})();
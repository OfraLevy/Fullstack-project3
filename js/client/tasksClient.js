class TasksClient {
  constructor() {
    this.api = new FajaxClient();
  }

  list(cb) {
    this.api.request("GET", "http://app/tasks", null, cb);
  }

  search(text, cb) {
    var url = "http://app/tasks?search=" + encodeURIComponent(text || "");
    this.api.request("GET", url, null, cb);
  }

  create(task, cb) {
    this.api.request("POST", "http://app/tasks", task, cb);
  }

  update(id, patch, cb) {
    this.api.request("PUT", "http://app/tasks/" + id, patch, cb);
  }

  remove(id, cb) {
    this.api.request("DELETE", "http://app/tasks/" + id, null, cb);
  }

  getOne(id, cb) {
    this.api.request("GET", "http://app/tasks/" + id, null, cb);
  }
}
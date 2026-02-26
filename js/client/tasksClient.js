class TasksClient {
  constructor() {
    this.api = new FajaxClient();
  }

  list(callback) {
    this.api.request("GET", "http://app/tasks", null, callback);
  }

  search(text, callback) {
    var url = "http://app/tasks?search=" + encodeURIComponent(text || "");
    this.api.request("GET", url, null, callback);
  }

  create(task, callback) {
    this.api.request("POST", "http://app/tasks", task, callback);
  }

  update(id, patch, callback) {
    this.api.request("PUT", "http://app/tasks/" + id, patch, callback);
  }

  remove(id, callback) {
    this.api.request("DELETE", "http://app/tasks/" + id, null, callback);
  }

  getOne(id, callback) {
    this.api.request("GET", "http://app/tasks/" + id, null, callback);
  }
}
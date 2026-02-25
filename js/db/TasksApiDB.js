class TasksApiDB {
  static create(ownerId, data) {
    return TasksDB.create(ownerId, data);
  }

  static list(ownerId) {
    return TasksDB.getByOwner(ownerId);
  }

  static get(ownerId, taskId) {
    return TasksDB.getById(ownerId, taskId);
  }

  static update(ownerId, taskId, updates) {
    return TasksDB.update(ownerId, taskId, updates);
  }

  static delete(ownerId, taskId) {
    return TasksDB.delete(ownerId, taskId);
  }

  static search(ownerId, text) {
    return TasksDB.search(ownerId, text);
  }
}
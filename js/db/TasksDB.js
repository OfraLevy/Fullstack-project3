class TasksDB {
  static STORAGE_KEY = "tasks_db";

  static _getData() {
    let raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return JSON.parse(raw);
  }

  static _saveData(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  static _generateId() {
    return "t_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  }

  static create(ownerId, data) {
    let tasks = this._getData();

    let task = {
      id: this._generateId(),
      ownerId: ownerId,
      title: data.title,
      details: data.details || "",
      done: data.done || false,
      priority: data.priority || "med",
      dueDate: data.dueDate || null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    tasks.push(task);
    this._saveData(tasks);

    return task;
  }

  static getByOwner(ownerId) {
    let tasks = this._getData();
    return tasks.filter(t => t.ownerId === ownerId);
  }

  static getById(ownerId, taskId) {
    let tasks = this._getData();
    return tasks.find(t => t.ownerId === ownerId && t.id === taskId) || null;
  }

  static update(ownerId, taskId, updates) {
    let tasks = this._getData();

    let task = tasks.find(t => t.ownerId === ownerId && t.id === taskId);
    if (!task) return null;

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.details !== undefined) task.details = updates.details;
    if (updates.done !== undefined) task.done = updates.done;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.dueDate !== undefined) task.dueDate = updates.dueDate;

    task.updatedAt = Date.now();

    this._saveData(tasks);
    return task;
  }

  static delete(ownerId, taskId) {
    let tasks = this._getData();
    tasks = tasks.filter(t => !(t.ownerId === ownerId && t.id === taskId));
    this._saveData(tasks);
  }

  static search(ownerId, text) {
    let tasks = this.getByOwner(ownerId);
    text = text.toLowerCase();

    return tasks.filter(t =>
      t.title.toLowerCase().includes(text) ||
      t.details.toLowerCase().includes(text)
    );
  }
}
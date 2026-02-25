class UsersDB {
  static STORAGE_KEY = "users_db";

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
    return "u_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
  }

  static create(username, password) {
    let users = this._getData();

    if (users.find(u => u.username === username)) {
      throw new Error("Username already exists");
    }

    let user = {
      id: this._generateId(),
      username: username,
      password: password,
      createdAt: Date.now()
    };

    users.push(user);
    this._saveData(users);

    return user;
  }

  static findByUsername(username) {
    let users = this._getData();
    return users.find(u => u.username === username) || null;
  }

  static findById(id) {
    let users = this._getData();
    return users.find(u => u.id === id) || null;
  }

  static getAll() {
    return this._getData();
  }

  static delete(id) {
    let users = this._getData();
    users = users.filter(u => u.id !== id);
    this._saveData(users);
  }
}
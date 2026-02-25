class UsersApiDB {
  static createUser(username, password) {
    return UsersDB.create(username, password);
  }

  static getUserByUsername(username) {
    return UsersDB.findByUsername(username);
  }

  static getUserById(id) {
    return UsersDB.findById(id);
  }
}
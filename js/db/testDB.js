localStorage.clear();

let u1 = UsersApiDB.createUser("aaa", "1111");
console.log(u1);

let u2 = UsersApiDB.getUserByUsername("aaa");
console.log(u2);

let byId = UsersApiDB.getUserById(u1.id);
console.log(byId);

let t1 = TasksApiDB.create(u1.id, { title: "Task 1" });
console.log(t1);

console.log(TasksApiDB.list(u1.id));

TasksApiDB.update(u1.id, t1.id, { done: true });

console.log(TasksApiDB.get(u1.id, t1.id));

TasksApiDB.delete(u1.id, t1.id);

console.log(TasksApiDB.list(u1.id));
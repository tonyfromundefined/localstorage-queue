const { LocalStorageQueue } = require("../lib/index");

const queue = new LocalStorageQueue({
  key: "something",
});

queue.on("hello", (data) => {
  console.log(data);
});

queue.listen();

setInterval(() => {
  queue.emit("hello", { world: true });
  // queue.emit("hello2", { world: true });
}, 500);

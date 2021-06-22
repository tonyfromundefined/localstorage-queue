const { LocalStorageQueue } = require("../lib/index");

const queue = new LocalStorageQueue({
  key: "something",
});

queue.on("hello2", (data) => {
  console.log(data);
});

queue.start();

setInterval(() => {
  // queue.emit("hello", { world: true });
  // queue.emit("hello2", { world: true });
}, 500);

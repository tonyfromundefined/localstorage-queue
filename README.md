# LocalStorage Queue

Queue(FIFO) implementation using LocalStorage API

## Install

```bash
$ yarn add localstorage-queue
```

## Usage

```typescript
import { LocalStorageQueue } from "localstorage-queue";

const queue = new LocalStorageQueue({
  key: "something",
});

// Issue an event
queue.emit("hello", { world: true });

// Register a listener
queue.on("Hello", (data) => {
  console.log(data);
});

// listening...
queue.listen();
```

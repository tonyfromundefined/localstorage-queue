import * as z from "zod";

const SchemaQueueItem = z.object({
  eventName: z.string(),
  data: z.object({}).nonstrict().optional(),
  _createdAt: z.string(),
});

const SchemaState = z.object({
  queue: z.array(SchemaQueueItem),
});

export class LocalStorageQueue {
  private __key: string;
  private __listeners: {
    [eventName: string]: Array<(data?: object) => void>;
  } = {};

  constructor({ key }: { key: string }) {
    if (typeof window === "undefined") {
      throw new Error(
        "LocalStorageQueue does not support environments" +
          " other than browser environments."
      );
    }
    this.__key = key;
  }

  emit(eventName: string, data?: object) {
    const queueItem = {
      eventName,
      data,
      _createdAt: new Date().toISOString(),
    };

    const prevState = this.getState();

    this.setState({
      ...prevState,
      queue: [...prevState.queue, queueItem],
    });
  }

  on(eventName: string, listener: (data?: object) => void) {
    const self = this;

    if (self.__listeners[eventName]) {
      self.__listeners[eventName].push(listener);
    } else {
      self.__listeners[eventName] = [listener];
    }

    return function dispose() {
      const idx = self.__listeners[eventName].indexOf(listener);
      self.__listeners[eventName].splice(idx, 1);
    };
  }

  start(interval: number = 100) {
    const i = setInterval(() => {
      while (this.process());
    }, interval);

    return function clear() {
      clearInterval(i);
    };
  }

  private process() {
    let processed = false;

    const state = this.getState();

    for (const key of Object.keys(this.__listeners)) {
      const queueItemIndex = state.queue.findIndex(
        (item) => item.eventName === key
      );

      if (queueItemIndex >= 0) {
        processed = true;

        const item = state.queue[queueItemIndex];

        for (const listener of this.__listeners[key]) {
          listener(item.data);
        }
      }

      state.queue.splice(queueItemIndex, 1);
    }

    this.setState({
      queue: state.queue,
    });

    return processed;
  }

  private getState(): z.infer<typeof SchemaState> {
    const item = window.localStorage.getItem(this.__key);
    return item ? SchemaState.parse(item) : this.initialState();
  }

  private setState(nextState: z.infer<typeof SchemaState>) {
    window.localStorage.setItem(this.__key, JSON.stringify(nextState));
  }

  private initialState(): z.infer<typeof SchemaState> {
    return {
      queue: [],
    };
  }
}

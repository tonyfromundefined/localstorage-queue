import * as z from "zod";

const SchemaQueueItem = z.object({
  eventName: z.string(),
  issuedAt: z.string(),
  data: z.object({}).nonstrict().optional(),
});

const SchemaState = z.object({
  queue: z.array(SchemaQueueItem),
});

export class LocalStorageQueue {
  private __key: string;
  private __listeners: {
    [eventName: string]: (data?: object) => void;
  } = {};

  constructor({ key }: { key: string }) {
    if (typeof localStorage === "undefined") {
      throw new Error(
        "LocalStorageQueue does not support environments" +
          " other than browser environments."
      );
    }
    this.__key = key;
  }

  emit(eventName: string, data?: object) {
    const issuedAt = new Date().toISOString();

    const queueItem = {
      eventName,
      issuedAt,
      data,
    };

    const prevState = this.getState();

    this.setState({
      ...prevState,
      queue: [...prevState.queue, queueItem],
    });
  }

  on(eventName: string, listener: (data?: object) => void) {
    const self = this;

    self.__listeners[eventName] = listener;

    return function dispose() {
      delete self.__listeners[eventName];
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
        const item = state.queue[queueItemIndex];

        state.queue.splice(queueItemIndex, 1);

        this.setState({
          queue: state.queue,
        });

        this.__listeners[key]?.(item.data);

        processed = true;
      }
    }

    return processed;
  }

  private getState(): z.infer<typeof SchemaState> {
    const item = localStorage.getItem(this.__key);
    return item ? SchemaState.parse(JSON.parse(item)) : this.initialState();
  }

  private setState(nextState: z.infer<typeof SchemaState>) {
    localStorage.setItem(this.__key, JSON.stringify(nextState));
  }

  private initialState(): z.infer<typeof SchemaState> {
    return {
      queue: [],
    };
  }
}

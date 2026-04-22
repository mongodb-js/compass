const noopChannel = {
  hasSubscribers: false,
  publish() {},
  subscribe() {},
  unsubscribe() {},
};

const noopTracingChannel = {
  hasSubscribers: false,
  tracePromise(fn: () => Promise<unknown>) {
    return fn();
  },
  traceSync(fn: () => unknown) {
    return fn();
  },
  traceCallback(fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
    return fn(...args);
  },
  start: noopChannel,
  end: noopChannel,
  asyncStart: noopChannel,
  asyncEnd: noopChannel,
  error: noopChannel,
};

export function channel(_name: string) {
  return noopChannel;
}

export function tracingChannel(_name: string) {
  return noopTracingChannel;
}

export function hasSubscribers(_name: string) {
  return false;
}

export function subscribe() {}
export function unsubscribe() {}

export default {
  channel,
  tracingChannel,
  hasSubscribers,
  subscribe,
  unsubscribe,
};

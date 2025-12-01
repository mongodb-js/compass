import Reflux from 'reflux';

export type StoreWithStateMixin<T extends Record<string, unknown>> =
  Reflux.Store & {
    readonly state: Readonly<T>;
    setState(newState: Partial<T>): void;
    storeDidUpdate?(prevState: T): void;
    getInitialState(): T;
  } & {
    [k in keyof T]: { trigger(value: T[k]): void };
  };

function attachAction<T extends Record<string, unknown>>(
  this: StoreWithStateMixin<T>,
  actionName: keyof T
) {
  if (this[actionName]) {
    // eslint-disable-next-line no-console
    console.warn(
      'Not attaching event ' + String(actionName) + '; key already exists'
    );
    return;
  }
  this[actionName] = Reflux.createAction();
}

export default <T extends Record<string, unknown>>() => ({
  setState: function (this: StoreWithStateMixin<T>, state: Partial<T>) {
    let changed = false;
    const prevState = { ...this.state };

    for (const key of Object.keys(state) as (keyof T)[]) {
      if (this.state[key] !== state[key]) {
        this.state[key] = state[key]!;
        this[key].trigger(state[key] as any);
        changed = true;
      }
    }

    if (changed) {
      //this.state = extend(this.state, state);

      if (typeof this.storeDidUpdate === 'function') {
        this.storeDidUpdate(prevState);
      }

      this.trigger(this.state);
    }
  },

  init: function (this: StoreWithStateMixin<T>) {
    if (typeof this.getInitialState === 'function') {
      this.state = this.getInitialState();
      for (const key of Object.keys(this.state)) {
        attachAction.call(this, key);
      }
    }
  },
});

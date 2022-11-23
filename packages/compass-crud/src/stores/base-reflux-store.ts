import type { Store, StoreDefinition } from 'reflux';

// Helper for reflux stores in TS
export abstract class BaseRefluxStore<Options> implements StoreDefinition {
  options: Options;
  listenTo!: Store['listenTo'];
  trigger!: Store['trigger'];

  constructor(options: Options) {
    this.options = options;
    // Using a temporary class is helpful for getting proper TS definitions, however,
    // prototype methods are non-enumerable by default so we re-define them here
    // in order for reflux to pick up on them.
    for (const method of Object.getOwnPropertyNames(
      Object.getPrototypeOf(this)
    )) {
      // eslint-disable-next-line no-self-assign
      this[method as keyof this] = this[method as keyof this];
    }
  }
}

import type {
  AmpersandCollectionConstructor,
  AmpersandModelConstructor,
} from 'ampersand-model';
import toNs from 'mongodb-ns';

const NamespaceCache = new Map<string, ReturnType<typeof toNs>>();

export function getNamespaceInfo(ns: string): ReturnType<typeof toNs> {
  if (!NamespaceCache.has(ns)) {
    NamespaceCache.set(ns, toNs(ns));
  }
  const cached = NamespaceCache.get(ns);
  if (!cached) {
    throw Error('Namespace cache is empty');
  }
  return cached;
}

export function mergeInit(
  ...opts: { initialize?: (...args: unknown[]) => unknown }[]
): { initialize(...args: unknown[]): void } {
  return {
    initialize(...args: unknown[]) {
      opts.forEach(({ initialize }) => {
        initialize?.call(this, ...args);
      });
    },
  };
}

const Inflight = new Map();

function debounceInflight(fn: (...args: unknown[]) => unknown) {
  return function (this: AnyModel, ...args: unknown[]) {
    const callId = this.isCollection
      ? `${this.parent?.cid ?? ''}$$coll$$${fn.name}`
      : `${this.cid}$$${fn.name}`;
    if (Inflight.has(callId)) {
      return Inflight.get(callId);
    }
    const promise = (async () => await fn.call(this, ...args))().finally(() => {
      Inflight.delete(callId);
    });
    Inflight.set(callId, promise);
    return promise;
  };
}

export function debounceActions(actions: string[]): { initialize(): void } {
  return {
    initialize(this: any) {
      actions.forEach((key) => {
        if (key in this && typeof this[key] === 'function') {
          const origFn = this[key];
          this[key] = debounceInflight(origFn);
        }
      });
    },
  };
}

export type ModelInstance = InstanceType<AmpersandModelConstructor>;

export type CollectionInstance = InstanceType<AmpersandCollectionConstructor>;

export type AnyModel = ModelInstance | CollectionInstance;

export type ModelStatus =
  | 'initial'
  | 'fetching'
  | 'refreshing'
  | 'ready'
  | 'error';

export const ModelStatusValues = [
  'initial',
  'fetching',
  'refreshing',
  'ready',
  'error',
] as const;

function getParent(model: AnyModel) {
  return model.parent ?? model.collection ?? null;
}

function propagate(this: AnyModel, evtName: string, ...args: unknown[]) {
  let parent = getParent(this);
  while (parent) {
    parent.emit(evtName, ...args);
    parent = getParent(parent);
  }
}

export function propagateCollectionEvents(namespace: string): {
  initialize(): void;
} {
  return {
    initialize(this: any) {
      if (this.isCollection) {
        this.on('add', propagate.bind(this, `add:${namespace}`));
        this.on('remove', propagate.bind(this, `remove:${namespace}`));
        this.on('change', propagate.bind(this, `change:${namespace}`));
        for (const key of Object.keys(this.model.prototype._definition)) {
          this.on(
            `change:${key}`,
            propagate.bind(this, `change:${namespace}.${key}`)
          );
        }
      }
    },
  };
}

export function getParentByType(
  model: AnyModel,
  type: string
): ModelInstance | null {
  const parent = getParent(model);
  return parent
    ? parent.isState && parent.getType() === type
      ? parent
      : getParentByType(parent, type)
    : null;
}

/**
 * Returns true if model is not ready (was fetched before and is not updating at
 * the moment) or force fetch is requested
 */
export function shouldFetch(status: ModelStatus, force: boolean): boolean {
  return force || status !== 'ready';
}

/**
 * Returns true if model was fetched before (or is currently being fetched) or
 * force fetch is requested
 */
export function shouldRefresh(status: ModelStatus, force: boolean): boolean {
  return force || status !== 'initial';
}

const VisitedModels = new WeakSet();

function isAnyModel(val?: any): val is AnyModel {
  return val && (val.isState || val.isCollection);
}

export function removeListenersRec(model?: unknown): typeof VisitedModels {
  if (!isAnyModel(model) || VisitedModels.has(model)) {
    return VisitedModels;
  }
  VisitedModels.add(model);
  model.off();
  if (model.isCollection) {
    model.forEach((item) => {
      removeListenersRec(item);
    });
  }
  for (const prop of Object.values(model)) {
    removeListenersRec(prop);
  }
  return VisitedModels;
}

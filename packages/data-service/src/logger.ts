import type { MongoLogId, MongoLogWriter } from 'mongodb-log-writer';
import _debug from 'debug';

export const debug = _debug('data-service');

// Re-implemented rather than imported so that renderer-side consumers of this
// module don't pull mongodb-log-writer (and its Node-only stream/zlib/v8
// dependencies) into the bundle. Same approach as compass-logging's provider.
//
// Disable prettier so that dupedLogId stays on the same line to be ignored by
// the check-logids script
// prettier-ignore
export function mongoLogId(id: number): MongoLogId { // !dupedLogId
  return { __value: id };
}

export type DataServiceImplLogger = Pick<
  MongoLogWriter,
  'debug' | 'info' | 'warn' | 'error' | 'fatal'
>;

export type UnboundDataServiceImplLogger = DataServiceImplLogger & {
  mongoLogId: (id: number) => MongoLogId;
};

type BoundLogMethod<T> = T extends (
  component: string,
  id: MongoLogId,
  context: string,
  ...rest: infer R
) => void
  ? (id: MongoLogId, ...args: R) => void
  : never;

export type BoundLogger = {
  [key in keyof DataServiceImplLogger]: BoundLogMethod<
    DataServiceImplLogger[key]
  >;
};

export abstract class WithLogContext {
  protected abstract _logger: BoundLogger;
}

export type { MongoLogId };

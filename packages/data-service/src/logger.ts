import type { MongoLogWriter } from 'mongodb-log-writer';
import { mongoLogId } from 'mongodb-log-writer';
import _debug from 'debug';

export const debug = _debug('data-service');

export { mongoLogId };

type MongoLogId = ReturnType<typeof mongoLogId>;

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

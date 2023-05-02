import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { mongoLogId, debug as _debug } from '@mongodb-js/compass-logging';

export const debug = _debug.extend('data-service');

export { mongoLogId };

type MongoLogId = ReturnType<typeof mongoLogId>;

export type DataServiceImplLogger = Pick<
  LoggerAndTelemetry['log']['unbound'],
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

import React, { useRef } from 'react';
import type { Logger } from './logger';
import type { MongoLogId, MongoLogWriter } from 'mongodb-log-writer';
import { createServiceLocator } from 'hadron-app-registry';

export type { Logger } from './logger';

const noop = () => {
  // noop
};

export function createNoopLogger(component = 'NOOP-LOGGER'): Logger {
  return {
    log: {
      component,
      get unbound() {
        return this as unknown as MongoLogWriter;
      },
      write: () => true,
      info: noop,
      warn: noop,
      error: noop,
      fatal: noop,
      debug: noop,
    },
    debug: noop as unknown as Logger['debug'],
    mongoLogId,
  };
}

const LoggerContext = React.createContext<{
  createLogger(component: string): Logger;
}>({ createLogger: createNoopLogger });

export const LoggerProvider = LoggerContext.Provider;

export function createLoggerLocator(component: string) {
  return createServiceLocator(
    useLogger.bind(null, component),
    'createLoggerLocator'
  );
}

export function useLogger(component: string): Logger {
  const context = React.useContext(LoggerContext);
  if (!context) {
    throw new Error('Logger service is missing from React context');
  }
  const loggerRef = useRef<Logger>();
  if (!loggerRef.current) {
    loggerRef.current = context.createLogger(component);
  }
  return loggerRef.current;
}

type FirstArgument<F> = F extends (...args: [infer A, ...any]) => any
  ? A
  : F extends { new (...args: [infer A, ...any]): any }
  ? A
  : never;

export function withLogger<
  T extends ((...args: any[]) => any) | { new (...args: any[]): any }
>(
  ReactComponent: T,
  component: string
): React.FunctionComponent<Omit<FirstArgument<T>, 'logger'>> {
  const WithLogger = (
    props: Omit<FirstArgument<T>, 'logger'> & React.Attributes
  ) => {
    const logger = useLogger(component);
    return React.createElement(ReactComponent, { ...props, logger });
  };
  return WithLogger;
}

// To avoid dependency on mongodb-log-writer that will pull in a lot of Node.js
// specific code we re-implement mongoLogId in the provider to re-export
//
// Disable prettier so that dupedLogId stays on the same line to be ignored by
// the check-logids script
// prettier-ignore
export function mongoLogId(id: number): MongoLogId { // !dupedLogId
  return { __value: id };
}

export type { MongoLogWriter } from 'mongodb-log-writer';

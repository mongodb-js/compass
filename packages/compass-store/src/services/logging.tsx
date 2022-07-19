import React from 'react';
import { createContext, useContext, useRef } from 'react';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

export type CompassLogging = typeof createLoggerAndTelemetry;

const CompassLoggingContext = createContext<CompassLogging | null>(null);

export const CompassLoggingProvider: React.FunctionComponent<{
  service?: CompassLogging;
}> = ({ service, children }) => {
  const _service = useRef<CompassLogging>();
  if (!_service.current) {
    _service.current = service ?? createLoggerAndTelemetry;
  }
  return (
    <CompassLoggingContext.Provider value={_service.current}>
      {children}
    </CompassLoggingContext.Provider>
  );
};

/**
 * @internal
 */
export const useCompassLogging = (): CompassLogging => {
  const createLoggerAndTelemetry = useContext(CompassLoggingContext);
  if (!createLoggerAndTelemetry) {
    throw new Error('Expected to find service in React context');
  }
  return createLoggerAndTelemetry;
};

export const useLoggingAndTelemetry = (
  component: string
): ReturnType<CompassLogging> => {
  const createLoggerAndTelemetry = useCompassLogging();
  const loggerRef = useRef<ReturnType<CompassLogging> | null>(null);
  if (!loggerRef.current) {
    loggerRef.current = createLoggerAndTelemetry(component);
  }
  return loggerRef.current;
};

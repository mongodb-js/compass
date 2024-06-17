import React from 'react';
import {
  mongoLogId,
  LoggerAndTelemetryProvider,
  useLoggerAndTelemetry,
} from '@mongodb-js/compass-logging/provider';
import type {
  DebugFunction,
  LogFunction,
  TrackFunction,
} from './logger-and-telemetry';
import { useCompassWebLoggerAndTelemetry } from './logger-and-telemetry';
import { renderHook, cleanup } from '@testing-library/react-hooks';
import Sinon from 'sinon';
import { expect } from 'chai';

describe('useCompassWebLoggerAndTelemetry', function () {
  function renderLoggerAndTelemetryHook({
    onTrack,
    onDebug,
    onLog,
  }: {
    onTrack?: TrackFunction;
    onDebug?: DebugFunction;
    onLog?: LogFunction;
  } = {}) {
    const Wrapper: React.FunctionComponent = ({ children }) => {
      const loggerAndTelemetry = useCompassWebLoggerAndTelemetry({
        onTrack,
        onDebug,
        onLog,
      });
      return (
        <LoggerAndTelemetryProvider value={loggerAndTelemetry}>
          {children}
        </LoggerAndTelemetryProvider>
      );
    };
    return renderHook(
      () => {
        return useLoggerAndTelemetry('TEST');
      },
      { wrapper: Wrapper }
    );
  }

  beforeEach(cleanup);

  it('should call callback props when logger is called', function () {
    const onLog = Sinon.stub();
    const onTrack = Sinon.stub();
    const onDebug = Sinon.stub();

    const {
      result: { current: loggerAndTelemetry },
    } = renderLoggerAndTelemetryHook({ onLog, onTrack, onDebug });

    loggerAndTelemetry.debug('foo bar');
    loggerAndTelemetry.track('Tracking Event', { param: 1 });
    loggerAndTelemetry.log.info(mongoLogId(123), 'Ctx', 'msg', { attr: 1 });

    expect(onDebug).to.have.been.calledOnceWith('TEST', 'foo bar');
    expect(onTrack).to.have.been.calledOnceWith('Tracking Event', { param: 1 });
    expect(onLog).to.have.been.calledOnceWith(
      'info',
      'TEST',
      mongoLogId(123),
      'Ctx',
      'msg',
      { attr: 1 }
    );
  });
});

import React from 'react';
import {
  mongoLogId,
  LoggerProvider,
  useLogger,
} from '@mongodb-js/compass-logging/provider';
import type {
  DebugFunction,
  LogFunction,
  TrackFunction,
} from './logger-and-telemetry';
import { useCompassWebLoggerAndTelemetry } from './logger-and-telemetry';
import { renderHook, cleanup } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import { expect } from 'chai';

describe('useCompassWebLoggerAndTelemetry', function () {
  function renderLoggerAndTelemetryHook({
    onDebug,
    onLog,
  }: {
    onTrack?: TrackFunction;
    onDebug?: DebugFunction;
    onLog?: LogFunction;
  } = {}) {
    const Wrapper: React.FunctionComponent = ({ children }) => {
      const logger = useCompassWebLoggerAndTelemetry({
        onDebug,
        onLog,
      });

      return <LoggerProvider value={logger}>{children}</LoggerProvider>;
    };
    return renderHook(
      () => {
        return useLogger('TEST');
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
    loggerAndTelemetry.log.info(mongoLogId(123), 'Ctx', 'msg', { attr: 1 });

    expect(onDebug).to.have.been.calledOnceWith('TEST', 'foo bar');
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

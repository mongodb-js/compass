import React from 'react';
import {
  mongoLogId,
  LoggerProvider,
  useLogger,
} from '@mongodb-js/compass-logging/provider';
import type { DebugFunction, LogFunction, TrackFunction } from './logger';
import { useCompassWebLoggerAndTelemetry } from './logger';
import { renderHook } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import { expect } from 'chai';

describe('useCompassWebLoggerAndTelemetry', function () {
  function renderLoggerHook({
    onDebug,
    onLog,
    onTrack,
  }: {
    onDebug?: DebugFunction;
    onLog?: LogFunction;
    onTrack?: TrackFunction;
  } = {}) {
    const Wrapper: React.FunctionComponent = ({ children }) => {
      const { logger } = useCompassWebLoggerAndTelemetry({
        onDebug,
        onLog,
        onTrack,
        preferences: {} as any,
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

  it('should call callback props when logger is called', function () {
    const logs: any[] = [];
    const onLog = Sinon.stub().callsFake((entry) => logs.push(entry));
    const onDebug = Sinon.stub();

    const {
      result: { current: logger },
    } = renderLoggerHook({ onLog, onDebug });

    logger.debug('foo bar');
    logger.log.info(mongoLogId(123), 'Ctx', 'msg', { attr: 1 });

    expect(onDebug).to.have.been.calledOnceWith('TEST', 'foo bar');
    expect(logs).to.deep.equal([
      {
        t: logs[0].t,
        s: 'I',
        c: 'TEST',
        id: 123,
        ctx: 'Ctx',
        msg: 'msg',
        attr: { attr: 1 },
      },
    ]);
  });

  it('should call onLog hook synchronously', function () {
    let callbackExecuted = false;
    const onLog = Sinon.stub().callsFake(() => {
      callbackExecuted = true;
    });

    const {
      result: { current: logger },
    } = renderLoggerHook({ onLog });

    // Callback should not have been called yet
    expect(callbackExecuted).to.be.false;

    // Call the logger
    logger.log.info(mongoLogId(456), 'Test', 'sync test');

    // Callback should have been called synchronously before this assertion
    expect(callbackExecuted).to.be.true;
    expect(onLog).to.have.been.calledOnce;
  });
});

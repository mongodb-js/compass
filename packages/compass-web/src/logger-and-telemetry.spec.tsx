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
import { renderHook, waitFor } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import { expect } from 'chai';
import {
  TelemetryProvider,
  useTelemetry,
} from '@mongodb-js/compass-telemetry/provider';

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
      const { logger, telemetry } = useCompassWebLoggerAndTelemetry({
        onDebug,
        onLog,
        onTrack,
        preferences: {
          getPreferences() {
            return {};
          },
        } as any,
      });

      return (
        <LoggerProvider value={logger}>
          <TelemetryProvider options={telemetry}>{children}</TelemetryProvider>
        </LoggerProvider>
      );
    };
    return renderHook(
      () => {
        const logger = useLogger('TEST');
        const track = useTelemetry();
        return { logger, track };
      },
      { wrapper: Wrapper }
    );
  }

  it('should call callback props when logger or telemetry are called', async function () {
    const logs: any[] = [];
    const onLog = Sinon.stub().callsFake((entry) => logs.push(entry));
    const onDebug = Sinon.stub();
    const onTrack = Sinon.stub();

    const {
      result: {
        current: { logger, track },
      },
    } = renderLoggerHook({ onLog, onDebug, onTrack });

    track('Theme Changed', { theme: 'OS_THEME' });
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

    await waitFor(() => {
      expect(onTrack).to.have.been.calledOnceWith('Theme Changed', {
        theme: 'OS_THEME',
      });
    });
  });

  it('should call onLog hook synchronously', function () {
    let callbackExecuted = false;
    const onLog = Sinon.stub().callsFake(() => {
      callbackExecuted = true;
    });

    const {
      result: {
        current: { logger },
      },
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

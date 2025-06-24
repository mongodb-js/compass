import React from 'react';
import {
  mongoLogId,
  LoggerProvider,
  useLogger,
} from '@mongodb-js/compass-logging/provider';
import type { DebugFunction, LogFunction } from './logger';
import { useCompassWebLogger } from './logger';
import { renderHook } from '@mongodb-js/testing-library-compass';
import Sinon from 'sinon';
import { expect } from 'chai';

describe('useCompassWebLogger', function () {
  function renderLoggerHook({
    onDebug,
    onLog,
  }: {
    onDebug?: DebugFunction;
    onLog?: LogFunction;
  } = {}) {
    const Wrapper: React.FunctionComponent = ({ children }) => {
      const logger = useCompassWebLogger({
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
});

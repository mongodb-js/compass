import { expect, use } from 'chai';
import sinon from 'ts-sinon';
const sinonChai = require('sinon-chai'); // weird with import
use(sinonChai);

import ShellEvaluator from './index';
import { EventEmitter } from 'events';

describe('ShellEvaluator', () => {
  let shellEvaluator: ShellEvaluator;
  let busMock: EventEmitter;
  let internalStateMock: any;
  let showSpy: any;
  let itSpy: any;
  let exitSpy: any;
  let useSpy: any;
  const dontCallEval = () => { throw new Error('unreachable'); };

  beforeEach(() => {
    useSpy = sinon.spy();
    showSpy = sinon.spy();
    itSpy = sinon.spy();
    exitSpy = sinon.spy();
    internalStateMock = {
      messageBus: busMock,
      shellApi: { use: useSpy, show: showSpy, it: itSpy, exit: exitSpy, quit: exitSpy },
      asyncWriter: {
        process: (i: string): string => (i),
        symbols: {
          saveState: sinon.spy(), revertState: sinon.spy()
        }
      }
    } as any;
    for (const name of ['use', 'show', 'it', 'exit', 'quit']) {
      internalStateMock.shellApi[name].isDirectShellCommand = true;
    }
    busMock = new EventEmitter();

    shellEvaluator = new ShellEvaluator(internalStateMock);
  });

  describe('customEval', () => {
    it('strips trailing spaces and ; before calling commands', async() => {
      await shellEvaluator.customEval(dontCallEval, 'use somedb;  ', {}, '');
      expect(useSpy).to.have.been.calledWith('somedb');
    });

    it('splits commands at an arbitrary amount of whitespace', async() => {
      await shellEvaluator.customEval(dontCallEval, 'use   somedb;', {}, '');
      expect(useSpy).to.have.been.calledWith('somedb');
    });

    it('forwards show commands', async() => {
      const dontCallEval = () => { throw new Error('unreachable'); };
      await shellEvaluator.customEval(dontCallEval, 'show dbs;', {}, '');
      expect(showSpy).to.have.been.calledWith('dbs');
      await shellEvaluator.customEval(dontCallEval, 'show log startupWarnings;', {}, '');
      expect(showSpy).to.have.been.calledWith('log', 'startupWarnings');
    });

    it('forwards the it command', async() => {
      const dontCallEval = () => { throw new Error('unreachable'); };
      await shellEvaluator.customEval(dontCallEval, 'it', {}, '');
      expect(itSpy).to.have.been.calledWith();
    });

    it('forwards the exit/quit command', async() => {
      const dontCallEval = () => { throw new Error('unreachable'); };
      await shellEvaluator.customEval(dontCallEval, 'exit', {}, '');
      expect(exitSpy).to.have.been.calledWith();
    });

    it('forwards the exit/quit command', async() => {
      const dontCallEval = () => { throw new Error('unreachable'); };
      await shellEvaluator.customEval(dontCallEval, 'quit', {}, '');
      expect(exitSpy).to.have.been.calledWith();
    });

    it('calls original eval for plain javascript', async() => {
      const originalEval = sinon.spy();
      await shellEvaluator.customEval(originalEval, 'doSomething();', {}, '');
      expect(originalEval.firstCall.args[0]).to.include('doSomething');
      expect(originalEval.firstCall.args[1]).to.deep.equal({});
      expect(originalEval.firstCall.args[2]).to.equal('');
    });
    it('reverts state if error thrown', async() => {
      const originalEval = (): any => { throw new Error(); };
      const revertSpy = sinon.spy();
      const saveSpy = sinon.spy();
      shellEvaluator.revertState = revertSpy;
      shellEvaluator.saveState = saveSpy;
      try {
        await shellEvaluator.customEval(originalEval, 'anything()', {}, '');
        // eslint-disable-next-line no-empty
      } catch (e) {
      }
      expect(revertSpy.calledOnce).to.be.true;
      expect(saveSpy.calledOnce).to.be.true;
    });
    it('does not revert state with no error', async() => {
      const originalEval = (): any => { return 1; };
      const revertSpy = sinon.spy();
      const saveSpy = sinon.spy();
      shellEvaluator.revertState = revertSpy;
      shellEvaluator.saveState = saveSpy;
      await shellEvaluator.customEval(originalEval, 'anything()', {}, '');
      expect(revertSpy.calledOnce).to.be.false;
      expect(saveSpy.calledOnce).to.be.true;
    });
    it('allows specifying custom result handlers', async() => {
      const shellEvaluator = new ShellEvaluator<string>(internalStateMock, JSON.stringify);
      const originalEval = sinon.stub();
      originalEval.returns({ a: 1 });
      const result = await shellEvaluator.customEval(originalEval, 'doSomething();', {}, '');
      expect(result).to.equal('{"a":1}');
    });
  });
});

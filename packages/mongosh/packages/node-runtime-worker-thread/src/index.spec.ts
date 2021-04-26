import path from 'path';
import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { MongoshBus } from '@mongosh/types';
import { startTestServer } from '../../../testing/integration-testing-hooks';
import { WorkerRuntime } from '../dist/index';

chai.use(sinonChai);

function createMockEventEmitter() {
  return (sinon.stub({ on() {}, emit() {} }) as unknown) as MongoshBus;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('WorkerRuntime', () => {
  let runtime: WorkerRuntime;

  afterEach(async() => {
    if (runtime) {
      await runtime.terminate();
      runtime = null;
    }
  });

  describe('spawn errors', () => {
    const brokenScript = path.resolve(
      __dirname,
      '..',
      '__fixtures__',
      'script-that-throws.js'
    );

    afterEach(() => {
      delete process.env.CHILD_PROCESS_PROXY_SRC_PATH_DO_NOT_USE_THIS_EXCEPT_FOR_TESTING;
    });

    it('should return init error if child process failed to spawn', async() => {
      process.env.CHILD_PROCESS_PROXY_SRC_PATH_DO_NOT_USE_THIS_EXCEPT_FOR_TESTING = brokenScript;

      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

      let err;

      try {
        await runtime.evaluate('1+1');
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('message').match(/Child process failed to start/);
    });

    it('should return init error if worker in child process failed to spawn', async() => {
      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true }, {
        env: {
          WORKER_RUNTIME_SRC_PATH_DO_NOT_USE_THIS_EXCEPT_FOR_TESTING: brokenScript
        }
      });

      let err;

      try {
        await runtime.evaluate('1+1');
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('message').match(/Worker thread failed to start/);
    });
  });

  describe('evaluate', () => {
    it('should evaluate and return basic values', async() => {
      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });
      const result = await runtime.evaluate('1+1');

      expect(result.printable).to.equal(2);
    });

    describe('errors', () => {
      it("should throw an error if it's thrown during evaluation", async() => {
        runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

        let err: Error;

        try {
          await runtime.evaluate('throw new TypeError("Oh no, types!")');
        } catch (e) {
          err = e;
        }

        expect(err).to.be.instanceof(Error);
        expect(err).to.have.property('name', 'TypeError');
        expect(err).to.have.property('message', 'Oh no, types!');
        expect(err)
          .to.have.property('stack')
          .matches(/TypeError: Oh no, types!/);
      });

      it("should return an error if it's returned from evaluation", async() => {
        runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

        const { printable } = await runtime.evaluate(
          'new SyntaxError("Syntax!")'
        );

        expect(printable).to.be.instanceof(Error);
        expect(printable).to.have.property('name', 'SyntaxError');
        expect(printable).to.have.property('message', 'Syntax!');
        expect(printable)
          .to.have.property('stack')
          .matches(/SyntaxError: Syntax!/);
      });
    });
  });

  describe('getCompletions', () => {
    const testServer = startTestServer('shared');

    it('should return completions', async() => {
      runtime = new WorkerRuntime(await testServer.connectionString());
      const completions = await runtime.getCompletions('db.coll1.f');

      expect(completions).to.deep.contain({ completion: 'db.coll1.find' });
    });
  });

  describe('getShellPrompt', () => {
    const testServer = startTestServer('shared');

    it('should return prompt when connected to the server', async() => {
      runtime = new WorkerRuntime(await testServer.connectionString());
      const result = await runtime.getShellPrompt();

      expect(result).to.match(/>/);
    });
  });

  describe('setEvaluationListener', () => {
    it('allows to set evaluation listener for runtime', async() => {
      const evalListener = {
        onPrompt: sinon.spy(() => 'password123')
      };

      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

      runtime.setEvaluationListener(evalListener);

      const password = await runtime.evaluate('passwordPrompt()');

      expect(evalListener.onPrompt).to.have.been.called;
      expect(password.printable).to.equal('password123');
    });
  });

  describe('eventEmitter', () => {
    const testServer = startTestServer('shared');

    it('should propagate emitted events from worker', async() => {
      const eventEmitter = createMockEventEmitter();

      runtime = new WorkerRuntime(
        await testServer.connectionString(),
        {},
        {},
        {},
        eventEmitter
      );

      await runtime.evaluate('db.getCollectionNames()');

      expect(eventEmitter.emit).to.have.been.calledWith('mongosh:api-call', {
        arguments: {},
        class: 'Database',
        db: 'test',
        method: 'getCollectionNames'
      });
    });
  });

  describe('terminate', () => {
    function isRunning(pid: number): boolean {
      try {
        process.kill(pid, 0);
        return true;
      } catch (e) {
        return false;
      }
    }

    // We will be testing a bunch of private props that can be accessed only with
    // strings to make TS happy
    /* eslint-disable dot-notation */
    it('should terminate child process', async() => {
      const runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });
      await runtime.terminate();
      expect(runtime['childProcess']).to.have.property('killed', true);
      expect(isRunning(runtime['childProcess'].pid)).to.equal(false);
    });

    it('should remove all listeners from childProcess', async() => {
      const runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });
      await runtime.terminate();
      expect(runtime['childProcess'].listenerCount('message')).to.equal(0);
    });
    /* eslint-enable dot-notation */

    it('should cancel any in-flight runtime calls', async() => {
      const runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });
      let err: Error;
      try {
        await Promise.all([
          runtime.evaluate('while(true){}'),
          (async() => {
            // smol sleep to make sure we actually issued a call
            await sleep(100);
            await runtime.terminate();
          })()
        ]);
      } catch (e) {
        err = e;
      }
      expect(err).to.be.instanceof(Error);
      expect(err).to.have.property('isCanceled', true);
    });
  });

  describe('interrupt', () => {
    it('should interrupt in-flight async tasks', async() => {
      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

      await runtime.waitForRuntimeToBeReady();

      let err: Error;

      try {
        await Promise.all([
          runtime.evaluate('sleep(1000000)'),
          (async() => {
            // This is flaky when not enought time given to the worker to
            // finish the sync part of the work. If it causes too much issues
            // it would be okay to disable this test completely
            await sleep(5000);
            await runtime.interrupt();
          })()
        ]);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceof(Error);
      expect(err)
        .to.have.property('message')
        .match(/Async script execution was interrupted/);
    });

    it('should interrupt in-flight synchronous tasks', async() => {
      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

      await runtime.waitForRuntimeToBeReady();

      let err: Error;

      try {
        await Promise.all([
          runtime.evaluate('while(true){}'),
          (async() => {
            await sleep(200);
            await runtime.interrupt();
          })()
        ]);
      } catch (e) {
        err = e;
      }

      expect(err).to.be.instanceof(Error);
      expect(err)
        .to.have.property('message')
        .match(/Script execution was interrupted/);
    });

    it('should allow to evaluate again after interruption', async() => {
      runtime = new WorkerRuntime('mongodb://nodb/', {}, { nodb: true });

      await runtime.waitForRuntimeToBeReady();

      try {
        await Promise.all([
          runtime.evaluate('while(true){}'),
          (async() => {
            await sleep(200);
            await runtime.interrupt();
          })()
        ]);
      } catch (e) {
        // ignore
      }

      const result = await runtime.evaluate('1+1');

      expect(result).to.have.property('printable', 2);
    });
  });
});

import { start as originalStart, REPLServer } from 'repl';
import { start, OriginalEvalFunction, AsyncREPLOptions, evalStart, evalFinish } from './async-repl';
import { Readable, Writable, PassThrough } from 'stream';
import { promisify, inspect } from 'util';
import { once } from 'events';
import chai, { expect } from 'chai';
import sinon from 'ts-sinon';
import sinonChai from 'sinon-chai';
import { tick } from '../test/repl-helpers';
chai.use(sinonChai);

const delay = promisify(setTimeout);

function createDefaultAsyncRepl(extraOpts: Partial<AsyncREPLOptions> = {}): {
  input: Writable;
  output: Readable;
  repl: REPLServer;
} {
  const input = new PassThrough();
  const output = new PassThrough({ encoding: 'utf8' });

  const repl = start({
    input: input,
    output: output,
    prompt: '> ',
    asyncEval: async(originalEval: OriginalEvalFunction, input: string, context: any, filename: string) => {
      return originalEval(input, context, filename);
    },
    ...extraOpts
  });
  Object.assign(repl.context, { process, console });
  return { input, output, repl };
}

async function expectInStream(stream: Readable, substring: string): Promise<void> {
  let content = '';
  let found = false;
  for await (const chunk of stream) {
    content += chunk;
    if (content.includes(substring)) {
      found = true;
      break;
    }
  }
  expect(found).to.be.true;
}

describe('AsyncRepl', () => {
  before(() => {
    // nyc adds its own SIGINT listener that annoys use here.
    process.removeAllListeners('SIGINT');
  });

  it('performs basic synchronous evaluation', async() => {
    const { input, output } = createDefaultAsyncRepl();

    input.write('34 + 55\n');
    await expectInStream(output, '89');
  });

  it('performs basic asynchronous evaluation', async() => {
    const { input, output } = createDefaultAsyncRepl();

    input.write('Promise.resolve(34 + 55)\n');
    await expectInStream(output, '89');
  });

  it('allows sync interruption through SIGINT', async function() {
    if (process.platform === 'win32') {
      this.skip(); // No SIGINT on Windows.
      return;
    }

    const { input, output } = createDefaultAsyncRepl({ breakEvalOnSigint: true });

    input.write('while (true) { process.kill(process.pid, "SIGINT"); }\n');
    await expectInStream(output, 'execution was interrupted');
  });

  it('allows async interruption through SIGINT', async function() {
    if (process.platform === 'win32') {
      this.skip(); // No SIGINT on Windows.
      return;
    }

    const { input, output } = createDefaultAsyncRepl({ breakEvalOnSigint: true });

    input.write('new Promise(oopsIdontResolve => 0)\n');
    await delay(100);
    process.kill(process.pid, 'SIGINT');
    await expectInStream(output, 'execution was interrupted');
  });

  it('handles synchronous exceptions well', async() => {
    const { input, output } = createDefaultAsyncRepl();

    input.write('throw new Error("meow")\n');
    await expectInStream(output, 'meow');
  });

  it('handles asynchronous exceptions well', async() => {
    const { input, output } = createDefaultAsyncRepl();

    input.write('Promise.reject(new Error("meow"))\n');
    await expectInStream(output, 'meow');
  });

  it('handles recoverable syntax errors well', async() => {
    const { input, output } = createDefaultAsyncRepl();

    input.write('{ uptime: process.uptime(\n');
    let wroteClosingParenthesis = false;
    let foundUid = false;
    for await (const chunk of output) {
      if (chunk.includes('...') && !wroteClosingParenthesis) {
        input.write(')}\n');
        wroteClosingParenthesis = true;
      }
      if (chunk.includes('uptime:')) {
        foundUid = true;
        break;
      }
    }
    expect(foundUid).to.be.true;
  });

  it('delays the "exit" event until after asynchronous evaluation is finished', async() => {
    const { input, repl } = createDefaultAsyncRepl();
    let exited = false;
    repl.on('exit', () => { exited = true; });

    let resolve;
    repl.context.asyncFn = () => new Promise((res) => { resolve = res; });

    input.end('asyncFn()\n');
    expect(exited).to.be.false;

    await tick();
    resolve();
    expect(exited).to.be.false;

    await tick();
    expect(exited).to.be.true;
  });

  describe('allows handling exceptions from e.g. the writer function', () => {
    it('for succesful completions', async() => {
      const error = new Error('throwme');
      const { input, output } = createDefaultAsyncRepl({
        writer: (value: any): string => {
          if (value === 'meow') {
            throw error;
          }
          return inspect(value);
        },
        wrapCallbackError: (err: Error): Error => {
          return new Error('saw this error: ' + err.message);
        }
      });

      input.write('"meow"\n');
      await expectInStream(output, 'saw this error: throwme');
    });

    it('for unsuccesful completions', async() => {
      const error = new Error('throwme');
      const { input, output } = createDefaultAsyncRepl({
        writer: (value: any): string => {
          if (value?.message === 'meow') {
            throw error;
          }
          return inspect(value);
        },
        wrapCallbackError: (err: Error): Error => {
          return new Error('saw this error: ' + err.message);
        }
      });

      input.write('throw new Error("meow")\n');
      await expectInStream(output, 'saw this error: throwme');
    });

    it('defaults to passing the error through as-is', async() => {
      const error = new Error('raw error');
      const { input, output } = createDefaultAsyncRepl({
        writer: (value: any): string => {
          if (value?.message === 'meow') {
            throw error;
          }
          return inspect(value);
        }
      });

      input.write('throw new Error("meow")\n');
      await expectInStream(output, 'raw error');
    });
  });

  it('allows customizing the repl.start function', async() => {
    const { repl } = createDefaultAsyncRepl({
      start: (options) => {
        const repl = originalStart(options);
        repl.pause();
        return repl;
      }
    });

    expect((repl as any).paused).to.be.true;
  });

  // This one is really just for test coverage. :)
  it('allows emitting any kind of event on the active Domain', async() => {
    const { input, output, repl } = createDefaultAsyncRepl();
    repl.context.onEvent = sinon.spy();

    input.write('process.domain.on("x", onEvent); process.domain.emit("x"); 0\n');
    await expectInStream(output, '0');
    expect(repl.context.onEvent).to.have.been.calledWith();
  });

  context('emits information about the current evaluation', () => {
    it('for successful completion', async() => {
      const { input, repl } = createDefaultAsyncRepl();
      const startEvent = once(repl, evalStart);
      const finishEvent = once(repl, evalFinish);
      input.write('a = 1\n');
      expect(await startEvent).to.deep.equal([{
        input: 'a = 1\n'
      }]);
      expect(await finishEvent).to.deep.equal([{
        input: 'a = 1\n',
        success: true
      }]);
    });

    it('for error completion', async() => {
      const { input, repl } = createDefaultAsyncRepl();
      const finishEvent = once(repl, evalFinish);
      input.write('throw { msg: "foo" }\n');
      expect(await finishEvent).to.deep.equal([{
        input: 'throw { msg: "foo" }\n',
        success: false,
        recoverable: false,
        err: { msg: 'foo' }
      }]);
    });

    it('for unfinished (incomplete multiline) input', async() => {
      const { input, repl } = createDefaultAsyncRepl();
      const finishEvent = once(repl, evalFinish);
      input.write('({\n');
      const ev = (await finishEvent)[0];
      expect(ev).to.deep.equal({
        input: '({\n',
        success: false,
        recoverable: true,
        err: ev.err
      });
    });
  });
});

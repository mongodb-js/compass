import { promisify } from 'util';
import { spawn } from 'child_process';
import createDebug from 'debug';
import { inspect } from 'util';

const debug = createDebug('hadron-build:run');

type RunCallback = (err: Error | null, output?: string) => void;

/**
 * Use me when you want to run an external command instead
 * of using `child_process` directly because I'll handle
 * lots of platform edge cases for you and provide
 * nice debugging output when things go wrong!
 *
 * @example
 *  var args = ['--verify', process.env.APP_PATH];
 *  run('codesign', args, function(err){
 *    if(err){
 *      console.error('codesign verification failed!');
 *      process.exit(1);
 *    }
 *    console.log('codesign verification succeeded!');
 *  });
 *
 * @param {String} cmd - The bin name of your command, e.g. `grep`.
 * @param {Array} [args] - Arguments to pass to the command [Default `[]`].
 * @param {Object} [opts] - Options to pass to `child_process.spawn` [Default `{}`].
 * @param {Function} fn - Callback which recieves `(err, output)`.
 */
function run(
  cmd: string,
  args: string[] | RunCallback,
  opts?: Record<string, unknown> | RunCallback,
  fn?: RunCallback
): void {
  if (typeof opts === 'function') {
    fn = opts;
    opts = {};
  }

  if (typeof args === 'function') {
    fn = args;
    args = [];
    opts = {};
  }

  const resolvedArgs = args;
  const resolvedOpts = opts || {};
  const callback = fn as RunCallback;

  debug('running', { cmd, args: resolvedArgs });

  const output: Buffer[] = [];
  const proc = spawn(
    cmd,
    resolvedArgs,
    resolvedOpts as Parameters<typeof spawn>[2]
  );

  proc.stdout?.on('data', function (buf: Buffer) {
    buf
      .toString('utf-8')
      .split('\n')
      .map(function (line) {
        debug('  %s> %s', cmd, line);
      });
    output.push(buf);
  });

  proc.stderr?.on('data', function (buf: Buffer) {
    buf
      .toString('utf-8')
      .split('\n')
      .map(function (line) {
        debug('  %s> %s', cmd, line);
      });
    output.push(buf);
  });

  proc.on('exit', function (code) {
    const _output = Buffer.concat(output).toString('utf-8');
    if (code !== 0) {
      debug('command failed!', { cmd, output: _output });
      const error = Object.assign(
        new Error(
          `Command failed with exit code ${code}: ${cmd} ${resolvedArgs.join(
            ' '
          )} [enable line-by-line output via 'DEBUG=hadron*']`
        ),
        {
          output: {
            output: _output,
            [inspect.custom]() {
              return inspect(_output, { maxStringLength: Infinity });
            },
          },
        }
      );
      callback(error);
      return;
    }
    debug('completed! %j', { cmd });
    callback(null, _output);
  });
}

type RunWithAsync = typeof run & {
  async: (
    cmd: string,
    args: string[],
    opts: Record<string, unknown>
  ) => Promise<string>;
};

const runWithAsync = run as RunWithAsync;
runWithAsync.async = promisify(run) as RunWithAsync['async'];

export default runWithAsync;

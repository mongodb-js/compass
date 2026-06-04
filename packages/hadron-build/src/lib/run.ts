import { spawn } from 'child_process';
import createDebug from 'debug';
import { inspect } from 'util';

const debug = createDebug('hadron-build:run');

/**
 * Use me when you want to run an external command instead
 * of using `child_process` directly because I'll handle
 * lots of platform edge cases for you and provide
 * nice debugging output when things go wrong!
 *
 * @example
 *  const args = ['--verify', process.env.APP_PATH];
 *  await run('codesign', args);
 */
export function runCommand(
  cmd: string,
  args: string[],
  opts?: Record<string, unknown>
): Promise<string> {
  debug('running', { cmd, args });
  const { promise, resolve, reject } = Promise.withResolvers<string>();

  const output: Buffer[] = [];
  const proc = spawn(cmd, args, opts);

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
          `Command failed with exit code ${code}: ${cmd} ${args.join(
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
      reject(error);
      return;
    }
    debug('completed! %j', { cmd });
    resolve(_output);
  });
  return promise;
}

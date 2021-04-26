import type Mocha from 'mocha';
import assert from 'assert';
import { ChildProcess, spawn } from 'child_process';
import { once } from 'events';
import path from 'path';
import stripAnsi from 'strip-ansi';
import { eventually } from './helpers';

export type TestShellStartupResult = { state: 'prompt' } | { state: 'exit'; exitCode: number };
type SignalType = ChildProcess extends { kill: (signal: infer T) => any } ? T : never;

// Assume that prompt strings are those that end in '> ' but do not contain
// < or > (so that e.g. '- <repl>' in a stack trace is not considered a prompt).
const PROMPT_PATTERN = /^([^<>]*> ?)+$/m;
const ERROR_PATTERN_1 = /Thrown:\n([^>]*)/mg; // node <= 12.14
const ERROR_PATTERN_2 = /Uncaught[:\n ]+([^>]*)/mg;

/**
 * Test shell helper class.
 */
export class TestShell {
  private static _openShells: TestShell[] = [];

  static start(options: {
    args: string[];
    env?: Record<string, string>;
    removeSigintListeners?: boolean;
    cwd?: string;
    forceTerminal?: boolean;
  } = { args: [] }): TestShell {
    let shellProcess: ChildProcess;

    let env = options.env || process.env;
    if (options.forceTerminal) {
      env = { ...env, MONGOSH_FORCE_TERMINAL: '1' };
    }

    if (process.env.MONGOSH_TEST_EXECUTABLE_PATH) {
      shellProcess = spawn(process.env.MONGOSH_TEST_EXECUTABLE_PATH, [...options.args], {
        stdio: [ 'pipe', 'pipe', 'pipe' ],
        env: env,
        cwd: options.cwd
      });
    } else {
      if (options.removeSigintListeners) {
        // We set CLEAR_SIGINT_LISTENERS to remove all `process.on('SIGINT')`
        // listeners during Shell startup. This is unfortunately necessary,
        // because nyc registers a listener that is used to gather coverage
        // in case of an unclean exit for several signals, but this particular
        // one interferes with testing the actual process.on('SIGINT')
        // functionality here.
        env = { ...env, CLEAR_SIGINT_LISTENERS: '1' };
      }

      shellProcess = spawn('node', [path.resolve(__dirname, '..', 'bin', 'mongosh.js'), ...options.args], {
        stdio: [ 'pipe', 'pipe', 'pipe' ],
        env: env,
        cwd: options.cwd
      });
    }

    const shell = new TestShell(shellProcess);
    TestShell._openShells.push(shell);

    return shell;
  }

  static async killall(): Promise<void> {
    const exitPromises: Promise<unknown>[] = [];
    while (TestShell._openShells.length) {
      const shell = TestShell._openShells.pop();
      shell.kill();
      exitPromises.push(shell.waitForExit());
    }
    await Promise.all(exitPromises);
  }

  static async cleanup(this: Mocha.Context): Promise<void> {
    if (this.currentTest?.state === 'failed') {
      for (const shell of TestShell._openShells) {
        console.error({ pid: shell.process.pid, output: shell.output, rawOutput: shell.rawOutput });
      }
    }
    await TestShell.killall();
  }

  private _process: ChildProcess;

  private _output: string;
  private _rawOutput: string;
  private _onClose: Promise<number>;

  constructor(shellProcess: ChildProcess) {
    this._process = shellProcess;
    this._output = '';
    this._rawOutput = '';

    shellProcess.stdout.setEncoding('utf8').on('data', (chunk) => {
      this._output += stripAnsi(chunk);
      this._rawOutput += chunk;
    });

    shellProcess.stderr.setEncoding('utf8').on('data', (chunk) => {
      this._output += stripAnsi(chunk);
      this._rawOutput += chunk;
    });

    this._onClose = (async() => {
      const [ code ] = await once(shellProcess, 'close');
      return code;
    })();
  }

  get output(): string {
    return this._output;
  }

  get rawOutput(): string {
    return this._rawOutput;
  }

  get process(): ChildProcess {
    return this._process;
  }

  async waitForPrompt(start = 0): Promise<void> {
    await eventually(() => {
      const output = this._output.slice(start);
      const lines = output.split('\n');
      const found = !!lines.filter(l => l.match(PROMPT_PATTERN)) // a line that is the prompt must at least match the pattern
        .find(l => {
          // in some situations the prompt occurs multiple times in the line (but only in tests!)
          const prompts = l.trim().replace(/>$/g, '').split('>').map(m => m.trim());
          // if there are multiple prompt parts they must all equal
          if (prompts.length > 1) {
            for (const p of prompts) {
              if (p !== prompts[0]) {
                return false;
              }
            }
          }
          return true;
        });
      if (!found) {
        throw new assert.AssertionError({
          message: 'expected prompt',
          expected: PROMPT_PATTERN.toString(),
          actual: this._output.slice(0, start) + '[prompt search starts here]' + output
        });
      }
    });
  }

  waitForExit(): Promise<number> {
    return this._onClose;
  }


  async waitForPromptOrExit(): Promise<TestShellStartupResult> {
    return Promise.race([
      this.waitForPrompt().then(() => ({ state: 'prompt' } as TestShellStartupResult)),
      this.waitForExit().then(c => ({ state: 'exit', exitCode: c }) as TestShellStartupResult),
    ]);
  }

  kill(signal?: SignalType): void {
    this._process.kill(signal);
  }

  writeInput(chars: string): void {
    this._process.stdin.write(chars);
  }

  writeInputLine(chars: string): void {
    this.writeInput(`${chars}\n`);
  }

  async executeLine(line: string): Promise<string> {
    const previousOutputLength = this._output.length;
    this.writeInputLine(line);
    await this.waitForPrompt(previousOutputLength);
    return this._output.slice(previousOutputLength);
  }

  assertNoErrors(): void {
    const allErrors = this._getAllErrors();

    if (allErrors.length) {
      throw new assert.AssertionError({
        message: `Expected no errors in stdout but got: ${allErrors[0]}`,
        expected: '',
        actual: this._output
      });
    }
  }

  assertContainsOutput(expectedOutput: string): void {
    const onlyOutputLines = this._getOutputLines();
    if (!onlyOutputLines.join('\n').includes(expectedOutput)) {
      throw new assert.AssertionError({
        message: `Expected shell output to include ${JSON.stringify(expectedOutput)}`,
        actual: this._output,
        expected: expectedOutput
      });
    }
  }

  assertContainsError(expectedError: string): void {
    const allErrors = this._getAllErrors();

    if (!allErrors.find((error) => error.includes(expectedError))) {
      throw new assert.AssertionError({
        message: `Expected shell errors to include ${JSON.stringify(expectedError)}`,
        actual: this._output,
        expected: expectedError
      });
    }
  }

  assertNotContainsOutput(unexpectedOutput: string): void {
    const onlyOutputLines = this._getOutputLines();
    if (onlyOutputLines.join('\n').includes(unexpectedOutput)) {
      throw new assert.AssertionError({
        message: `Expected shell output not  to include ${JSON.stringify(unexpectedOutput)}`,
        actual: this._output,
        expected: `NOT ${unexpectedOutput}`
      });
    }
  }

  private _getOutputLines(): string[] {
    return this._output.split('\n');
  }

  private _getAllErrors(): string[] {
    const output = (this._output as any);
    return [
      ...output.matchAll(ERROR_PATTERN_1),
      ...output.matchAll(ERROR_PATTERN_2)
    ]
      .map(m => m[1].trim());
  }

  get logId(): string | null {
    const match = this._output.match(/^Current Mongosh Log ID:\s*(?<logId>[a-z0-9]{24})$/m);
    if (!match) {
      return null;
    }
    return match.groups.logId;
  }
}

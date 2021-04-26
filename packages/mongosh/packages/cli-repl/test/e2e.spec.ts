/* eslint-disable no-control-regex */
import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { eventually } from './helpers';
import { TestShell } from './test-shell';
import { startTestServer, skipIfServerVersion } from '../../../testing/integration-testing-hooks';
import { promises as fs, createReadStream } from 'fs';
import { promisify } from 'util';
import rimraf from 'rimraf';
import path from 'path';
import { readReplLogfile, hasNodeBug38314 } from './repl-helpers';

describe('e2e', function() {
  const testServer = startTestServer('shared');

  afterEach(TestShell.cleanup);

  describe('--version', () => {
    it('shows version', async() => {
      const shell = TestShell.start({ args: [ '--version' ] });

      await shell.waitForExit();

      shell.assertNoErrors();
      shell.assertContainsOutput(
        require('../package.json').version
      );
    });
  });

  describe('--nodb', () => {
    let shell: TestShell;
    beforeEach(async() => {
      shell = TestShell.start({
        args: [ '--nodb' ]
      });
      await shell.waitForPrompt();
      shell.assertNoErrors();
    });
    it('db throws', async() => {
      await shell.executeLine('db');
      shell.assertContainsError('MongoshInvalidInputError: [SHAPI-10004] No connected database');
    });
    it('show dbs throws InvalidInput', async() => {
      await shell.executeLine('show dbs');
      shell.assertContainsError('MongoshInvalidInputError: [SHAPI-10004] No connected database');
    });
    it('db.coll.find() throws InvalidInput', async() => {
      await shell.executeLine('db.coll.find()');
      shell.assertContainsError('MongoshInvalidInputError: [SHAPI-10004] No connected database');
      // We're seeing the prompt and not a stack trace.
      expect(shell.output).to.include('No connected database\n> ');
    });
    it('colorizes syntax errors', async() => {
      shell = TestShell.start({
        args: [ '--nodb' ],
        env: { ...process.env, FORCE_COLOR: 'true', TERM: 'xterm-256color' },
        forceTerminal: true
      });
      await shell.waitForPrompt();
      shell.assertNoErrors();

      await shell.executeLine('<cat>\n');
      await eventually(() => {
        expect(shell.rawOutput).to.match(/SyntaxError(\x1b\[.*m)+: Unexpected token/);
        expect(shell.rawOutput).to.match(/>(\x1b\[.*m)+ 1 \| (\x1b\[.*m)+<(\x1b\[.*m)+cat(\x1b\[.*m)+>(\x1b\[.*m)+/);
      });
    });
    it('closes the shell when "exit" is entered', async() => {
      const onExit = shell.waitForExit();
      await shell.writeInputLine('exit');
      expect(await onExit).to.equal(0);
    });
    it('closes the shell when "quit" is entered', async() => {
      const onExit = shell.waitForExit();
      await shell.writeInputLine('quit');
      expect(await onExit).to.equal(0);
    });
  });

  describe('set db', () => {
    describe('via host:port/test', () => {
      let shell;
      beforeEach(async() => {
        shell = TestShell.start({ args: [`${await testServer.hostport()}/testdb1`] });
        await shell.waitForPrompt();
        shell.assertNoErrors();
      });
      it('db set correctly', async() => {
        await shell.executeLine('db');
        shell.assertNoErrors();

        await eventually(() => {
          shell.assertContainsOutput('testdb1');
        });
      });
    });
    describe('via mongodb://uri', () => {
      let shell;
      beforeEach(async() => {
        shell = TestShell.start({ args: [`mongodb://${await testServer.hostport()}/testdb2`] });
        await shell.waitForPrompt();
        shell.assertNoErrors();
      });
      it('db set correctly', async() => {
        await shell.executeLine('db');
        shell.assertNoErrors();

        await eventually(() => {
          shell.assertContainsOutput('testdb2');
        });
      });
    });
    describe('legacy db only', () => {
      let shell;
      beforeEach(async() => {
        const port = await testServer.port();
        shell = TestShell.start({ args: ['testdb3', `--port=${port}`] });
        await shell.waitForPrompt();
        shell.assertNoErrors();
      });
      it('db set correctly', async() => {
        await shell.executeLine('db');
        shell.assertNoErrors();

        await eventually(() => {
          shell.assertContainsOutput('testdb3');
        });
      });
    });
  });

  describe('with connection string', () => {
    let db;
    let client;
    let shell: TestShell;
    let dbName;

    beforeEach(async() => {
      const connectionString = await testServer.connectionString();
      dbName = `test-${Date.now()}`;
      shell = TestShell.start({ args: [ connectionString ] });

      client = await MongoClient.connect(connectionString, {});

      db = client.db(dbName);

      await shell.waitForPrompt();
      shell.assertNoErrors();
    });

    afterEach(async() => {
      await db.dropDatabase();

      client.close();
    });

    it('version', async() => {
      const expected = require('../package.json').version;
      await shell.executeLine('version()');
      shell.assertContainsOutput(expected);
    });

    it('fle addon is available', async() => {
      const result = await shell.executeLine(
        '`<${typeof db._mongo._serviceProvider.fle.ClientEncryption}>`');
      expect(result).to.include('<function>');
    });

    describe('error formatting', () => {
      it('throws when a syntax error is encountered', async() => {
        await shell.executeLine('<x');
        shell.assertContainsError('SyntaxError: Unexpected token');
      });
      it('throws a runtime error', async() => {
        await shell.executeLine('throw new Error(\'a errmsg\')');
        shell.assertContainsError('Error: a errmsg');
      });
      it('recognizes a driver error as error', async() => {
        await shell.executeLine('db.coll.initializeOrderedBulkOp().find({}).update({}, {}).execute()');
        // output varies by server version
        expect(shell.output).to.match(
          /multi update (only works with \$ operators|is not supported for replacement-style update)/);
      });
    });
    it('throws multiline input with a single line string', async() => {
      // this is an unterminated string constant and should throw, since it does
      // not pass: https://www.ecma-international.org/ecma-262/#sec-line-terminators
      await shell.executeLine('"this is a multi\nline string');
      shell.assertContainsError('SyntaxError: Unterminated string constant');
    });

    describe('literals', async() => {
      it('number', async() => {
        await shell.executeLine('1');
        shell.assertNoErrors();

        await eventually(() => {
          shell.assertContainsOutput('1');
        });
        it('string', async() => {
          await shell.executeLine('"string"');
          shell.assertNoErrors();

          await eventually(() => {
            shell.assertContainsOutput('string');
          });
        });
        it('undefined', async() => {
          await shell.executeLine('undefined');
          shell.assertNoErrors();
        });
        it('null', async() => {
          await shell.executeLine('null');
          shell.assertNoErrors();

          await eventually(() => {
            shell.assertContainsOutput('1');
          });
        });
        it('bool', async() => {
          await shell.executeLine('true');
          shell.assertNoErrors();

          await eventually(() => {
            shell.assertContainsOutput('true');
          });
        });
      });
    });
    it('runs an unterminated function', async() => {
      await shell.writeInputLine('function x () {\nconsole.log(\'y\')\n }');
      shell.assertNoErrors();
    });

    it('runs an unterminated function', async() => {
      await shell.writeInputLine('function x () {');
      shell.assertNoErrors();
    });

    it('runs help command', async() => {
      await shell.executeLine('help');

      await eventually(() => {
        shell.assertContainsOutput('Shell Help');
      });

      shell.assertNoErrors();
    });

    it('db set correctly', async() => {
      await shell.executeLine('db');
      shell.assertNoErrors();

      await eventually(() => {
        shell.assertContainsOutput('test');
      });
    });

    it('allows to find documents', async() => {
      await shell.writeInputLine(`use ${dbName}`);

      await db.collection('test').insertMany([
        { doc: 1 },
        { doc: 2 },
        { doc: 3 }
      ]);

      await shell.writeInputLine('db.test.find()');

      await eventually(() => {
        shell.assertContainsOutput('doc: 1');
        shell.assertContainsOutput('doc: 2');
        shell.assertContainsOutput('doc: 3');
      });
      shell.assertNotContainsOutput('CursorIterationResult');

      shell.assertNoErrors();
    });

    it('allows to find documents using aggregate', async() => {
      await shell.writeInputLine(`use ${dbName}`);

      await db.collection('test').insertMany([
        { doc: 1 },
        { doc: 2 },
        { doc: 3 }
      ]);

      await shell.writeInputLine('db.test.aggregate({ $match: {} })');

      await eventually(() => {
        shell.assertContainsOutput('doc: 1');
        shell.assertContainsOutput('doc: 2');
        shell.assertContainsOutput('doc: 3');
      });
      shell.assertNotContainsOutput('CursorIterationResult');

      shell.assertNoErrors();
    });

    it('allows collections with .', async() => {
      await shell.writeInputLine(`use ${dbName}`);

      await db.collection('test.dot').insertMany([
        { doc: 1 },
        { doc: 2 },
        { doc: 3 }
      ]);

      await shell.writeInputLine('db.test.dot.find()');

      await eventually(() => {
        shell.assertContainsOutput('doc: 1');
        shell.assertContainsOutput('doc: 2');
        shell.assertContainsOutput('doc: 3');
      });

      shell.assertNoErrors();
    });

    it('rewrites async for collections with .', async() => {
      await shell.writeInputLine(`use ${dbName}`);
      await shell.writeInputLine('const x = db.test.dot.insertOne({ d: 1 })');
      await shell.writeInputLine('x.insertedId');

      await eventually(() => {
        shell.assertContainsOutput('ObjectId');
      });

      shell.assertNoErrors();
    });

    it('rewrites async for collections in the same statement', async() => {
      await shell.writeInputLine(`use ${dbName}`);
      await shell.writeInputLine('db.test.insertOne({ d: 1 }).acknowledged');

      await eventually(() => {
        shell.assertContainsOutput('true');
      });

      shell.assertNoErrors();
    });

    it('rewrites async properly for mapReduce', async() => {
      await shell.executeLine(`use ${dbName}`);
      await shell.executeLine('db.test.insertMany([{i:1},{i:2},{i:3},{i:4}]);');
      const result = await shell.executeLine(`db.test.mapReduce(function() {
        emit(this.i % 2, this.i);
      }, function(key, values) {
        return Array.sum(values);
      }, { out: { inline: 1 } }).results`);
      expect(result).to.include('{ _id: 0, value: 6 }');
      expect(result).to.include('{ _id: 1, value: 4 }');
    });

    it('rewrites async properly for common libraries', async function() {
      this.timeout(120_000);
      await shell.executeLine(`use ${dbName}`);
      await shell.executeLine('db.test.insertOne({ d: new Date("2021-04-07T11:24:54+02:00") })');
      shell.writeInputLine(`load(${JSON.stringify(require.resolve('lodash'))})`);
      shell.writeInputLine(`load(${JSON.stringify(require.resolve('moment'))})`);
      shell.writeInputLine('print("loaded" + "scripts")');
      await eventually(() => {
        // Use eventually explicitly to get a bigger timeout, lodash is
        // quite “big” in terms of async rewriting
        shell.assertContainsOutput('loadedscripts');
      }, { timeout: 60_000 });
      const result = await shell.executeLine(
        'moment(_.first(_.map(db.test.find().toArray(), "d"))).format("X")');
      expect(result).to.include('1617787494');
      shell.assertNotContainsOutput('[BABEL]');
    });

    it('expands explain output indefinitely', async() => {
      await shell.executeLine('explainOutput = db.test.find().explain()');
      await shell.executeLine('explainOutput.a = {b:{c:{d:{e:{f:{g:{h:{i:{j:{}}}}}}}}}}');
      expect(await shell.executeLine('explainOutput')).to.match(/g:\s*\{\s*h:\s*\{\s*i:\s*\{\s*j:/);
    });

    it('expands explain output from aggregation indefinitely', async() => {
      await shell.executeLine('explainOutput = db.test.aggregate([{ $limit: 1 }], {explain: "queryPlanner"})');
      await shell.executeLine('explainOutput.a = {b:{c:{d:{e:{f:{g:{h:{i:{j:{}}}}}}}}}}');
      expect(await shell.executeLine('explainOutput')).to.match(/g:\s*\{\s*h:\s*\{\s*i:\s*\{\s*j:/);
    });
  });

  describe('Ctrl+C aka SIGINT', () => {
    before(function() {
      if (process.platform === 'win32') {
        this.skip(); // There is no SIGINT on Windows.
      }
    });

    let shell;
    beforeEach(async() => {
      shell = TestShell.start({ args: [ '--nodb' ], removeSigintListeners: true });
      await shell.waitForPrompt();
      shell.assertNoErrors();
    });
    it('interrupts sync execution', async() => {
      await shell.executeLine('void process.removeAllListeners("SIGINT")');
      const result = shell.executeLine('while(true);');
      setTimeout(() => shell.kill('SIGINT'), 1000);
      await result;
      shell.assertContainsError('interrupted');
    });
    it('interrupts async awaiting', async() => {
      const result = shell.executeLine('new Promise(() => {});');
      setTimeout(() => shell.kill('SIGINT'), 3000);
      await result;
      shell.assertContainsError('interrupted');
    });
    it('interrupts load()', async() => {
      const filename = path.resolve(__dirname, 'fixtures', 'load', 'infinite-loop.js');
      const result = shell.executeLine(`load(${JSON.stringify(filename)})`);
      setTimeout(() => shell.kill('SIGINT'), 3000);
      await result;
      shell.assertContainsError('interrupted');
    });
    it('behaves normally after an exception', async() => {
      await shell.executeLine('throw new Error()');
      await new Promise((resolve) => setTimeout(resolve, 100));
      shell.kill('SIGINT');
      await shell.waitForPrompt();
      await new Promise((resolve) => setTimeout(resolve, 100));
      shell.assertNotContainsOutput('interrupted');
    });
  });

  describe('printing', () => {
    let shell;
    beforeEach(async() => {
      shell = TestShell.start({ args: [ '--nodb' ] });
      await shell.waitForPrompt();
      shell.assertNoErrors();
    });
    it('console.log() prints output exactly once', async() => {
      const result = await shell.executeLine('console.log(42);');
      expect(result).to.match(/\b42\b/);
      expect(result).not.to.match(/\b42[\s\r\n]*42\b/);
    });
    it('print() prints output exactly once', async() => {
      const result = await shell.executeLine('print(42);');
      expect(result).to.match(/\b42\b/);
      expect(result).not.to.match(/\b42[\s\r\n]*42\b/);
    });
  });

  describe('pipe from stdin', () => {
    let shell: TestShell;
    beforeEach(async() => {
      shell = TestShell.start({ args: [ await testServer.connectionString() ] });
    });

    it('reads and runs code from stdin, with .write()', async() => {
      const dbName = `test-${Date.now()}`;
      shell.process.stdin.write(`
      use ${dbName};
      db.coll1.insertOne({ foo: 55 });
      db.coll1.insertOne({ foo: 89 });
      db.coll1.aggregate([{$group: {_id: null, total: {$sum: '$foo'}}}])
      `);
      await eventually(() => {
        shell.assertContainsOutput('total: 144');
      });
    });

    it('reads and runs code from stdin, with .end()', async() => {
      const dbName = `test-${Date.now()}`;
      shell.process.stdin.end(`
      use ${dbName};
      db.coll1.insertOne({ foo: 55 });
      db.coll1.insertOne({ foo: 89 });
      db.coll1.aggregate([{$group: {_id: null, total: {$sum: '$foo'}}}])
      `);
      await eventually(() => {
        shell.assertContainsOutput('total: 144');
      });
    });

    it('reads and runs the vscode extension example playground', async() => {
      createReadStream(path.resolve(__dirname, 'fixtures', 'exampleplayground.js'))
        .pipe(shell.process.stdin);
      await eventually(() => {
        shell.assertContainsOutput("{ _id: 'xyz', totalSaleAmount: 150 }");
      });
    });

    it('treats piping a script into stdin line by line', async() => {
      // This script doesn't work if evaluated as a whole, only when evaluated
      // line-by-line, due to Automatic Semicolon Insertion (ASI).
      createReadStream(path.resolve(__dirname, 'fixtures', 'asi-script.js'))
        .pipe(shell.process.stdin);
      await eventually(() => {
        shell.assertContainsOutput('admin;system.version;');
      });
    });
  });

  describe('Node.js builtin APIs in the shell', () => {
    let shell;
    beforeEach(async() => {
      shell = TestShell.start({
        args: [ '--nodb' ],
        cwd: path.resolve(__dirname, 'fixtures', 'require-base'),
        env: {
          ...process.env,
          NODE_PATH: path.resolve(__dirname, 'fixtures', 'node-path')
        }
      });
      await shell.waitForPrompt();
      shell.assertNoErrors();
    });

    it('require() searches the current working directory according to Node.js rules', async() => {
      let result;
      result = await shell.executeLine('require("a")');
      expect(result).to.match(/Error: Cannot find module 'a'/);
      // Wait for double prompt because of Node.js REPL bug
      if (hasNodeBug38314()) await eventually(() => shell.assertContainsOutput('> > '));
      result = await shell.executeLine('require("./a")');
      expect(result).to.match(/^A$/m);
      result = await shell.executeLine('require("b")');
      expect(result).to.match(/^B$/m);
      result = await shell.executeLine('require("c")');
      expect(result).to.match(/^C$/m);
    });

    it('Can use Node.js APIs without any extra effort', async() => {
      // Too lazy to write a fixture
      const result = await shell.executeLine(
        `fs.readFileSync(${JSON.stringify(__filename)}, 'utf8')`);
      expect(result).to.include('Too lazy to write a fixture');
    });
  });

  describe('files loaded from command line', () => {
    context('file from disk', () => {
      it('loads a file from the command line as requested', async() => {
        const shell = TestShell.start({
          args: [ '--nodb', './hello1.js' ],
          cwd: path.resolve(__dirname, 'fixtures', 'load')
        });
        await eventually(() => {
          shell.assertContainsOutput('hello one');
        });
        // We can't assert the exit code here currently because that breaks
        // when run under coverage, as we currently specify the location of
        // coverage files via a relative path and nyc fails to write to that
        // when started from a changed cwd.
        await shell.waitForExit();
        shell.assertNoErrors();
      });

      it('drops into shell if --shell is used', async() => {
        const shell = TestShell.start({
          args: [ '--nodb', '--shell', './hello1.js' ],
          cwd: path.resolve(__dirname, 'fixtures', 'load')
        });
        await shell.waitForPrompt();
        shell.assertContainsOutput('hello one');
        expect(await shell.executeLine('2 ** 16 + 1')).to.include('65537');
        shell.assertNoErrors();
      });

      it('fails with the error if the loaded script throws', async() => {
        const shell = TestShell.start({
          args: [ '--nodb', '--shell', './throw.js' ],
          cwd: path.resolve(__dirname, 'fixtures', 'load')
        });
        await eventually(() => {
          shell.assertContainsOutput('Error: uh oh');
        });
        expect(await shell.waitForExit()).to.equal(1);
      });
    });

    context('--eval', () => {
      const script = 'const a = "hello", b = " one"; a + b';
      it('loads a script from the command line as requested', async() => {
        const shell = TestShell.start({
          args: [ '--nodb', '--eval', script ]
        });
        await eventually(() => {
          shell.assertContainsOutput('hello one');
        });
        expect(await shell.waitForExit()).to.equal(0);
        shell.assertNoErrors();
      });

      it('drops into shell if --shell is used', async() => {
        const shell = TestShell.start({
          args: [ '--nodb', '--eval', script, '--shell' ]
        });
        await shell.waitForPrompt();
        shell.assertContainsOutput('hello one');
        expect(await shell.executeLine('2 ** 16 + 1')).to.include('65537');
        shell.assertNoErrors();
      });

      it('fails with the error if the loaded script throws', async() => {
        const shell = TestShell.start({
          args: [ '--nodb', '--eval', 'throw new Error("uh oh")' ]
        });
        await eventually(() => {
          shell.assertContainsOutput('Error: uh oh');
        });
        expect(await shell.waitForExit()).to.equal(1);
      });
    });
  });

  describe('config, logging and rc file', async() => {
    let shell: TestShell;
    let homedir: string;
    let configPath: string;
    let logBasePath: string;
    let logPath: string;
    let historyPath: string;
    let readConfig: () => Promise<any>;
    let readLogfile: () => Promise<any[]>;
    let startTestShell: (...extraArgs: string[]) => Promise<TestShell>;
    let env: Record<string, string>;

    beforeEach(() => {
      homedir = path.resolve(
        __dirname, '..', '..', '..', 'tmp', `cli-repl-home-${Date.now()}-${Math.random()}`);
      env = {
        ...process.env, HOME: homedir, USERPROFILE: homedir
      };
      if (process.platform === 'win32') {
        env.LOCALAPPDATA = path.join(homedir, 'local');
        env.APPDATA = path.join(homedir, 'roaming');
        logBasePath = path.resolve(homedir, 'local', 'mongodb', 'mongosh');
        configPath = path.resolve(homedir, 'roaming', 'mongodb', 'mongosh', 'config');
        historyPath = path.resolve(homedir, 'roaming', 'mongodb', 'mongosh', 'mongosh_repl_history');
      } else {
        logBasePath = path.resolve(homedir, '.mongodb', 'mongosh');
        configPath = path.resolve(homedir, '.mongodb', 'mongosh', 'config');
        historyPath = path.resolve(homedir, '.mongodb', 'mongosh', 'mongosh_repl_history');
      }
      readConfig = async() => JSON.parse(await fs.readFile(configPath, 'utf8'));
      readLogfile = async() => readReplLogfile(logPath);
      startTestShell = async(...extraArgs: string[]) => {
        const shell = TestShell.start({
          args: [ '--nodb', ...extraArgs ],
          env: env,
          forceTerminal: true
        });
        await shell.waitForPrompt();
        shell.assertNoErrors();
        return shell;
      };
    });

    afterEach(async function() {
      await TestShell.killall.call(this);
      try {
        await promisify(rimraf)(homedir);
      } catch (err) {
        // On Windows in CI, this can fail with EPERM for some reason.
        // If it does, just log the error instead of failing all tests.
        console.error('Could not remove fake home directory:', err);
      }
    });

    context('in fully accessible environment', () => {
      beforeEach(async() => {
        await fs.mkdir(homedir, { recursive: true });
        shell = await startTestShell();
        logPath = path.join(logBasePath, `${shell.logId}_log`);
      });

      describe('config file', async() => {
        it('sets up a config file', async() => {
          const config = await readConfig();
          expect(config.userId).to.match(/^[a-f0-9]{24}$/);
          expect(config.enableTelemetry).to.be.true;
          expect(config.disableGreetingMessage).to.be.true;
        });

        it('persists between sessions', async() => {
          const config1 = await readConfig();
          await startTestShell();
          const config2 = await readConfig();
          expect(config1.userId).to.equal(config2.userId);
        });
      });

      describe('telemetry toggling', () => {
        it('enableTelemetry() yields a success response', async() => {
          await shell.executeLine('enableTelemetry()');
          await eventually(() => {
            expect(shell.output).to.include('Telemetry is now enabled');
          });
          expect((await readConfig()).enableTelemetry).to.equal(true);
        });
        it('disableTelemetry() yields a success response', async() => {
          await shell.executeLine('disableTelemetry();');
          await eventually(() => {
            expect(shell.output).to.include('Telemetry is now disabled');
          });
          expect((await readConfig()).enableTelemetry).to.equal(false);
        });
      });

      describe('log file', () => {
        it('creates a log file that keeps track of session events', async() => {
          await shell.executeLine('print(123 + 456)');
          await eventually(async() => {
            expect(shell.output).to.include('579');
            const log = await readLogfile();
            expect(log.filter(logEntry => /evaluate-input/.test(logEntry.msg)))
              .to.have.lengthOf(1);
          });
        });

        it('includes information about the driver version', async() => {
          await eventually(async() => {
            const log = await readLogfile();
            expect(log.filter(logEntry => /driver-initialized/.test(logEntry.msg)))
              .to.have.lengthOf(1);
          });
        });
      });

      describe('history file', () => {
        it('persists between sessions', async() => {
          await shell.executeLine('a = 42');
          shell.writeInput('.exit\n');
          await shell.waitForExit();

          shell = await startTestShell();
          // Arrow up twice to skip the .exit line
          shell.writeInput('\u001b[A\u001b[A');
          await eventually(() => {
            expect(shell.output).to.include('a = 42');
          });
          shell.writeInput('\n.exit\n');
          await shell.waitForExit();

          expect(await fs.readFile(historyPath, 'utf8')).to.match(/^a = 42$/m);
        });

        it('is only user-writable (on POSIX)', async function() {
          if (process.platform === 'win32') {
            return this.skip(); // No sensible fs permissions on Windows
          }

          await shell.executeLine('a = 42');
          shell.writeInput('.exit\n');
          await shell.waitForExit();

          expect((await fs.stat(historyPath)).mode & 0o077).to.equal(0);
        });
      });

      describe('mongoshrc', () => {
        beforeEach(async() => {
          await fs.writeFile(path.join(homedir, '.mongoshrc.js'), 'print("hi from mongoshrc")');
        });

        it('loads .mongoshrc.js if it is there', async() => {
          shell = await startTestShell();
          shell.assertContainsOutput('hi from mongoshrc');
        });

        it('does not load .mongoshrc.js if --norc is passed', async() => {
          shell = await startTestShell('--norc');
          shell.assertNotContainsOutput('hi from mongoshrc');
        });
      });
    });

    context('in a restricted environment', () => {
      it('keeps working when the home directory cannot be created at all', async() => {
        await fs.writeFile(homedir, 'this is a file and not a directory');
        const shell = await startTestShell();
        await eventually(() => {
          expect(shell.output).to.include('Warning: Could not access file:');
        });
        await shell.executeLine('print(123 + 456)');
        await eventually(() => {
          expect(shell.output).to.include('579');
        });
      });

      it('keeps working when the log files cannot be created', async() => {
        await fs.mkdir(path.dirname(logBasePath), { recursive: true });
        await fs.writeFile(logBasePath, 'also not a directory');
        const shell = await startTestShell();
        await eventually(() => {
          expect(shell.output).to.include('Warning: Could not access file:');
        });
        await shell.executeLine('print(123 + 456)');
        await eventually(() => {
          expect(shell.output).to.include('579');
        });
        await shell.executeLine('enableTelemetry()');
        await eventually(() => {
          expect(shell.output).to.include('Telemetry is now enabled');
        });
      });

      it('keeps working when the config file is present but not writable', async function() {
        if (process.platform === 'win32' || process.getuid() === 0 || process.geteuid() === 0) {
          this.skip(); // There is no meaningful chmod on Windows, and root can ignore permissions.
          return;
        }
        await fs.mkdir(path.dirname(configPath), { recursive: true });
        await fs.writeFile(configPath, '{}');
        await fs.chmod(configPath, 0); // Remove all permissions
        const shell = await startTestShell();
        await eventually(() => {
          expect(shell.output).to.include('Warning: Could not access file:');
        });
        await shell.executeLine('print(123 + 456)');
        await eventually(() => {
          expect(shell.output).to.include('579');
        });
      });
    });
  });

  describe('versioned API', () => {
    let db;
    let dbName;
    let client;

    beforeEach(async() => {
      dbName = `test-${Date.now()}`;

      client = await MongoClient.connect(await testServer.connectionString(), {});
      db = client.db(dbName);
    });

    afterEach(async() => {
      await db.dropDatabase();
      client.close();
    });


    context('pre-4.4', () => {
      skipIfServerVersion(testServer, '> 4.4');

      it('errors if an API version is specified', async() => {
        const shell = TestShell.start({ args: [
          `${await testServer.connectionString()}/${dbName}`, '--apiVersion', '1'
        ] });
        await shell.waitForPrompt();
        expect(await shell.executeLine('db.coll.find().toArray()'))
          .to.include("Unrecognized field 'apiVersion'");
      });
    });

    context('post-4.4', () => {
      skipIfServerVersion(testServer, '<= 4.4');

      it('can specify an API version', async() => {
        const shell = TestShell.start({ args: [
          `${await testServer.connectionString()}/${dbName}`, '--apiVersion', '1'
        ] });
        await shell.waitForPrompt();
        expect(await shell.executeLine('db.coll.find().toArray()'))
          .to.include('[]');
        shell.assertNoErrors();
      });

      it('can iterate cursors', async() => {
        // Make sure SERVER-55593 doesn't happen to us.
        const shell = TestShell.start({ args: [
          `${await testServer.connectionString()}/${dbName}`, '--apiVersion', '1'
        ] });
        await shell.waitForPrompt();
        await shell.executeLine('for (let i = 0; i < 200; i++) db.coll.insert({i})');
        await shell.executeLine('const cursor = db.coll.find().limit(100).batchSize(10);');
        expect(await shell.executeLine('cursor.toArray()')).to.include('i: 5');
        shell.assertNoErrors();
      });
    });
  });

  describe('fail-fast connections', () => {
    it('fails fast for ENOTFOUND errors', async() => {
      const shell = TestShell.start({ args: [
        'mongodb://' + 'verymuchnonexistentdomainname'.repeat(10) + '.mongodb.net/'
      ] });
      const result = await shell.waitForPromptOrExit();
      expect(result).to.deep.equal({ state: 'exit', exitCode: 1 });
    });

    it('fails fast for ECONNREFUSED errors', async() => {
      const shell = TestShell.start({ args: [
        '--port', '0'
      ] });
      const result = await shell.waitForPromptOrExit();
      expect(result).to.deep.equal({ state: 'exit', exitCode: 1 });
    });
  });
});


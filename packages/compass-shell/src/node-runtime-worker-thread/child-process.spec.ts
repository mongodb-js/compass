import path from 'path';
import { once } from 'events';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import { EJSON, ObjectId } from 'bson';
import { startSharedTestServer } from '../../../testing/integration-testing-hooks';
import type { Caller, Exposed } from './rpc';
import { cancel, close, createCaller, exposeAll } from './rpc';
import { deserializeEvaluationResult } from './serializer';
import type { WorkerRuntime } from './child-process';
import type { RuntimeEvaluationResult } from '@mongosh/browser-runtime-core';
import { dummyOptions } from './index.spec';
import { type ChildProcess, spawn } from 'child_process';

chai.use(sinonChai);

// We need a compiled version so we can import it as a worker
const workerThreadModule = path.resolve(
  __dirname,
  '..',
  'dist',
  'child-process.js'
);

describe('child-process', function () {
  let childProcess: ChildProcess;
  let caller: Caller<WorkerRuntime>;

  beforeEach(async function () {
    childProcess = spawn(process.execPath, [workerThreadModule], {
      stdio: ['inherit', 'inherit', 'pipe', 'ipc'],
    });
    await once(childProcess, 'message');

    caller = createCaller(
      [
        'init',
        'evaluate',
        'getCompletions',
        'getShellPrompt',
        'setEvaluationListener',
      ],
      childProcess
    );
    const origEvaluate = caller.evaluate;
    caller.evaluate = (code: string): Promise<any> & { cancel(): void } => {
      const promise = origEvaluate(code).then(deserializeEvaluationResult);
      (promise as any).cancel = () => {};
      return promise as Promise<any> & { cancel(): void };
    };
  });

  afterEach(function () {
    if (childProcess) {
      childProcess.kill();
    }

    if (caller) {
      caller[cancel]();
      caller = null;
    }
  });

  it('should throw if worker is not initialized yet', async function () {
    const { evaluate } = caller;

    let err: Error;

    try {
      await evaluate('1 + 1');
    } catch (e: any) {
      err = e;
    }

    expect(err).to.be.instanceof(Error);
    expect(err)
      .to.have.property('message')
      .match(/Can't call evaluate before shell runtime is initiated/);
  });

  describe('evaluate', function () {
    describe('basic shell result values', function () {
      const primitiveValues: [string, string, unknown][] = [
        ['null', 'null', null],
        ['undefined', 'undefined', undefined],
        ['boolean', '!false', true],
        ['number', '1+1', 2],
        ['string', '"hello"', 'hello'],
      ];

      const everythingElse: [string, string, string | RegExp][] = [
        ['function', 'function abc() {}; abc', '[Function: abc]'],
        [
          'function with properties',
          'function def() {}; def.def = 1; def',
          '[Function: def] { def: 1 }',
        ],
        ['anonymous function', '(() => {})', /\[Function.+\]/],
        ['class constructor', 'class BCD {}; BCD', '[class BCD]'],
        [
          'class instalce',
          'class ABC { constructor() { this.abc = 1; } }; var abc = new ABC(); abc',
          'ABC { abc: 1 }',
        ],
        ['simple array', '[1, 2, 3]', '[ 1, 2, 3 ]'],
        [
          'simple array with empty items',
          '[1, 2,, 4]',
          '[ 1, 2, <1 empty item>, 4 ]',
        ],
        [
          'non-serializable array',
          '[1, 2, 3, () => {}]',
          /\[ 1, 2, 3, \[Function( \(anonymous\))?\] \]/,
        ],
        [
          'simple object',
          '({str: "foo", num: 123})',
          "{ str: 'foo', num: 123 }",
        ],
        [
          'non-serializable object',
          '({str: "foo", num: 123, bool: false, fn() {}})',
          "{ str: 'foo', num: 123, bool: false, fn: [Function: fn] }",
        ],
        [
          'object with bson',
          '({min: MinKey(), max: MaxKey(), int: NumberInt("1")})',
          '{ min: MinKey(), max: MaxKey(), int: Int32(1) }',
        ],
        [
          'object with everything',
          '({ cls: class A{}, fn() {}, bsonType: NumberInt("1"), str: "123"})',
          "{ cls: [class A], fn: [Function: fn], bsonType: Int32(1), str: '123' }",
        ],
      ];

      primitiveValues.concat(everythingElse).forEach((testCase) => {
        const [testName, evalValue, printable] = testCase;

        it(testName, async function () {
          const { init, evaluate } = caller;
          await init('mongodb://nodb/', dummyOptions, { nodb: true });
          const result = await evaluate(evalValue);
          expect(result).to.have.property('printable');
          if (printable instanceof RegExp) {
            expect(result.printable).to.match(printable);
          } else {
            expect(result.printable).to.deep.equal(printable);
          }
        });
      });
    });

    describe('shell-api results', function () {
      const testServer = startSharedTestServer();
      const db = `test-db-${Date.now().toString(16)}`;
      let exposed: Exposed<unknown>;

      afterEach(function () {
        if (exposed) {
          exposed[close]();
          exposed = null;
        }
      });

      type CommandTestRecord =
        | [string | string[], string]
        | [string | string[], string, any];

      const showCommand: CommandTestRecord[] = [
        [
          'show dbs',
          'ShowDatabasesResult',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable.find(({ name }: any) => name === 'admin')).to.not
              .be.undefined;
          },
        ],
        ['show collections', 'ShowCollectionsResult', []],
        ['show profile', 'ShowProfileResult', { count: 0 }],
        [
          'show roles',
          'ShowResult',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable.find(({ role }: any) => role === 'dbAdmin')).to.not
              .be.undefined;
          },
        ],
      ];

      const useCommand: CommandTestRecord[] = [
        [`use ${db}`, null, `switched to db ${db}`],
      ];

      const helpCommand: CommandTestRecord[] = [
        [
          'help',
          'Help',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable).to.have.property('help', 'Shell Help');
            expect(printable)
              .to.have.property('docs')
              .match(/https:\/\/docs.mongodb.com/);
          },
        ],
      ];

      const cursors: CommandTestRecord[] = [
        [
          [
            `use ${db}`,
            'db.coll.insertOne({ _id: ObjectId("000000000000000000000000"), foo: 321 });',
            'db.coll.aggregate({ $match: { foo: 321 } })',
          ],
          'AggregationCursor',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable).to.have.property('cursorHasMore', false);
            const doc = printable.documents[0];
            expect(EJSON.serialize(doc)).to.deep.equal(
              EJSON.serialize({
                _id: new ObjectId('000000000000000000000000'),
                foo: 321,
              })
            );
          },
        ],
        [
          [
            `use ${db}`,
            'db.coll.insertMany([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => ({ i })))',
            'db.coll.find({ i: { $mod: [2, 0] } }, { _id: 0 })',
          ],
          'Cursor',
          {
            documents: [{ i: 2 }, { i: 4 }, { i: 6 }, { i: 8 }, { i: 10 }],
            cursorHasMore: false,
          },
        ],
        [
          [
            `use ${db}`,
            "db.coll.insertMany('a'.repeat(100).split('').map(a => ({ a })))",
            'db.coll.find({}, { _id: 0 })',
            'it',
          ],
          'CursorIterationResult',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable.documents).to.include.deep.members([{ a: 'a' }]);
          },
        ],
      ];

      const crudCommands: CommandTestRecord[] = [
        [
          [`use ${db}`, 'db.coll.insertOne({ a: "a" })'],
          'InsertOneResult',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable).to.have.property('acknowledged', true);
            expect(printable)
              .to.have.property('insertedId')
              .instanceof(ObjectId);
          },
        ],
        [
          [`use ${db}`, 'db.coll.insertMany([{ b: "b" }, { c: "c" }])'],
          'InsertManyResult',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable).to.have.property('acknowledged', true);
            expect(printable)
              .to.have.nested.property('insertedIds[0]')
              .instanceof(ObjectId);
          },
        ],
        [
          [
            `use ${db}`,
            'db.coll.insertOne({ a: "a" })',
            'db.coll.updateOne({ a: "a" }, { $set: { a: "b" } })',
          ],
          'UpdateResult',
          {
            acknowledged: true,
            insertedId: null,
            matchedCount: 1,
            modifiedCount: 1,
            upsertedCount: 0,
          },
        ],
        [
          [
            `use ${db}`,
            'db.coll.insertOne({ a: "a" })',
            'db.coll.deleteOne({ a: "a" })',
          ],
          'DeleteResult',
          { acknowledged: true, deletedCount: 1 },
        ],
        [
          [`use ${db}`, 'db.coll.bulkWrite([{ insertOne: { d: "d" } }])'],
          'BulkWriteResult',
          ({ printable }: RuntimeEvaluationResult) => {
            expect(printable).to.have.property('acknowledged', true);
            expect(printable).to.have.property('insertedCount', 1);
            expect(printable)
              .to.have.nested.property('insertedIds[0]')
              .instanceof(ObjectId);
          },
        ],
      ];

      showCommand
        .concat(useCommand)
        .concat(helpCommand)
        .concat(cursors)
        .concat(crudCommands)
        .forEach((testCase) => {
          const [commands, resultType, printable] = testCase;

          let command: string;
          let prepare: undefined | string[];

          if (Array.isArray(commands)) {
            command = commands.pop();
            prepare = commands;
          } else {
            command = commands;
          }

          it(`"${command}" should return ${resultType} result`, async function () {
            // Without this dummy evaluation listener, a request to getConfig()
            // from the shell leads to a never-resolved Promise.
            exposed = exposeAll(
              {
                getConfig() {},
                validateConfig() {},
              },
              childProcess
            );

            const { init, evaluate } = caller;
            await init(await testServer.connectionString(), dummyOptions, {});

            if (prepare) {
              for (const code of prepare) {
                await evaluate(code);
              }
            }

            const result = await evaluate(command);

            expect(result).to.have.property('type', resultType);

            if (typeof printable === 'function') {
              printable(result);
            } else if (printable instanceof RegExp) {
              expect(result).to.have.property('printable').match(printable);
            } else if (typeof printable !== 'undefined') {
              expect(result)
                .to.have.property('printable')
                .deep.equal(printable);
            }
          });
        });
    });

    describe('errors', function () {
      it("should throw an error if it's thrown during evaluation", async function () {
        const { init, evaluate } = caller;

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        let err: Error;
        try {
          await evaluate('throw new TypeError("Oh no, types!")');
        } catch (e: any) {
          err = e;
        }

        expect(err).to.be.instanceof(Error);
        expect(err).to.have.property('name', 'TypeError');
        expect(err).to.have.property('message', 'Oh no, types!');
        expect(err)
          .to.have.property('stack')
          .matches(/TypeError: Oh no, types!/);
      });

      it('should preserve extra error properties', async function () {
        const { init, evaluate } = caller;

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        let err: Error;
        try {
          await evaluate(
            'throw Object.assign(new TypeError("Oh no, types!"), { errInfo: { message: "wrong type :S" } })'
          );
        } catch (e: any) {
          err = e;
        }

        expect(err).to.be.instanceof(Error);
        expect(err).to.have.property('name', 'TypeError');
        expect(err).to.have.property('message', 'Oh no, types!');
        expect((err as any).errInfo.message).to.equal('wrong type :S');
      });

      it("should return an error if it's returned from evaluation", async function () {
        const { init, evaluate } = caller;

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        const { printable } = await evaluate('new SyntaxError("Syntax!")');

        expect(printable).to.be.instanceof(Error);
        expect(printable).to.have.property('name', 'SyntaxError');
        expect(printable).to.have.property('message', 'Syntax!');
        expect(printable)
          .to.have.property('stack')
          .matches(/SyntaxError: Syntax!/);
      });

      it('should throw when trying to run two evaluations concurrently', async function () {
        const { init, evaluate } = caller;
        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        let err: Error;

        try {
          await Promise.all([
            evaluate('sleep(50); 1+1'),
            evaluate('sleep(50); 1+1'),
          ]);
        } catch (e: any) {
          err = e;
        }

        expect(err).to.be.instanceof(Error);
        expect(err)
          .to.have.property('message')
          .match(
            /Can't run another evaluation while the previous is not finished/
          );
      });
    });
  });

  describe('getShellPrompt', function () {
    const testServer = startSharedTestServer();

    it('should return prompt when connected to the server', async function () {
      const { init, getShellPrompt } = caller;

      await init(await testServer.connectionString());

      const result = await getShellPrompt();

      expect(result).to.match(/>/);
    });
  });

  describe('getCompletions', function () {
    const testServer = startSharedTestServer();

    it('should return completions', async function () {
      const { init, getCompletions } = caller;

      await init(await testServer.connectionString());

      const completions = await getCompletions('db.coll1.f');

      expect(completions).to.deep.contain({
        completion: 'db.coll1.find',
      });
    });
  });

  describe('evaluationListener', function () {
    const spySandbox = sinon.createSandbox();

    const createSpiedEvaluationListener = () => {
      const evalListener = {
        onPrint() {},
        onPrompt() {
          return '123';
        },
        getConfig() {},
        setConfig() {},
        resetConfig() {},
        validateConfig() {},
        listConfigOptions() {
          return ['displayBatchSize'];
        },
        onRunInterruptible() {},
      };

      spySandbox.spy(evalListener, 'onPrint');
      spySandbox.spy(evalListener, 'onPrompt');
      spySandbox.spy(evalListener, 'getConfig');
      spySandbox.spy(evalListener, 'setConfig');
      spySandbox.spy(evalListener, 'resetConfig');
      spySandbox.spy(evalListener, 'validateConfig');
      spySandbox.spy(evalListener, 'listConfigOptions');
      spySandbox.spy(evalListener, 'onRunInterruptible');

      return evalListener;
    };

    let exposed: Exposed<unknown>;

    afterEach(function () {
      if (exposed) {
        exposed[close]();
        exposed = null;
      }

      spySandbox.restore();
    });

    describe('onPrint', function () {
      it('should be called when shell evaluates `print`', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });
        await evaluate('print("Hi!")');

        expect(evalListener.onPrint).to.have.been.calledWith([
          { printable: 'Hi!', source: undefined, type: null },
        ]);
      });

      it('should correctly serialize bson objects', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });
        await evaluate('print(new ObjectId("62a209b0c7dc31e23ab9da45"))');

        expect(evalListener.onPrint).to.have.been.calledWith([
          {
            printable: "ObjectId('62a209b0c7dc31e23ab9da45')",
            source: undefined,
            type: 'InspectResult',
          },
        ]);
      });
    });

    describe('onPrompt', function () {
      it('should be called when shell evaluates `passwordPrompt`', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });
        const password = await evaluate('passwordPrompt()');

        expect(evalListener.onPrompt).to.have.been.called;
        expect(password.printable).to.equal('123');
      });
    });

    describe('getConfig', function () {
      it('should be called when shell evaluates `config.get()`', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        await evaluate('config.get("key")');
        expect(evalListener.getConfig).to.have.been.calledWith('key');
      });
    });

    describe('setConfig', function () {
      it('should be called when shell evaluates `config.set()`', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        await evaluate('config.set("displayBatchSize", 200)');
        expect(evalListener.validateConfig).to.have.been.calledWith(
          'displayBatchSize',
          200
        );
        expect(evalListener.setConfig).to.have.been.calledWith(
          'displayBatchSize',
          200
        );
      });
    });

    describe('resetConfig', function () {
      it('should be called when shell evaluates `config.reset()`', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        await evaluate('config.reset("displayBatchSize")');
        expect(evalListener.resetConfig).to.have.been.calledWith(
          'displayBatchSize'
        );
      });
    });

    describe('listConfigOptions', function () {
      it('should be called when shell evaluates `config[asPrintable]`', async function () {
        const { init, evaluate } = caller;
        const evalListener = createSpiedEvaluationListener();

        exposed = exposeAll(evalListener, childProcess);

        await init('mongodb://nodb/', dummyOptions, { nodb: true });

        await evaluate(`
        var JSSymbol = Object.getOwnPropertySymbols(Array.prototype)[0].constructor;
        config[JSSymbol.for("@@mongosh.asPrintable")]()`);
        expect(evalListener.listConfigOptions).to.have.been.calledWith();
      });
    });
  });
});

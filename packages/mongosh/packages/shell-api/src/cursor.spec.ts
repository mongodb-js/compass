import { signatures, toShellResult } from './index';
import Cursor from './cursor';
import { ReplPlatform, FindCursor as ServiceProviderCursor } from '@mongosh/service-provider-core';
import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES, ServerVersions } from './enums';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import sinon, { stubInterface, StubbedInstance } from 'ts-sinon';
import { CommonErrors, MongoshDeprecatedError, MongoshInvalidInputError, MongoshUnimplementedError } from '@mongosh/errors';
chai.use(sinonChai);
const { expect } = chai;

describe('Cursor', () => {
  describe('help', () => {
    const apiClass = new Cursor({
      _serviceProvider: { platform: ReplPlatform.CLI }
    } as any, {} as any);
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('signature', () => {
    it('signature for class correct', () => {
      expect(signatures.Cursor.type).to.equal('Cursor');
      expect(signatures.Cursor.hasAsyncChild).to.equal(true);
    });
    it('map signature', () => {
      expect(signatures.Cursor.attributes.map).to.deep.equal({
        type: 'function',
        returnsPromise: false,
        deprecated: false,
        returnType: 'Cursor',
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
  });
  describe('instance', () => {
    let wrappee;
    let cursor;
    beforeEach(() => {
      wrappee = {
        map: sinon.spy(),
        closed: true,
        bufferedCount() { return 0; }
      };
      cursor = new Cursor({
        _serviceProvider: { platform: ReplPlatform.CLI },
        _batchSize: () => 20
      } as any, wrappee);
    });

    it('sets dynamic properties', async() => {
      expect((await toShellResult(cursor)).type).to.equal('Cursor');
      expect((await toShellResult(cursor._it())).type).to.equal('CursorIterationResult');
      expect((await toShellResult(cursor)).printable).to.deep.equal({
        documents: [],
        cursorHasMore: false
      });
      expect((await toShellResult(cursor.help)).type).to.equal('Help');
    });

    it('map() returns a new cursor', () => {
      expect(cursor.map()).to.equal(cursor);
    });
    it('pretty returns the same cursor', () => {
      expect(cursor.pretty()).to.equal(cursor);
    });

    it('calls wrappee.map with arguments', () => {
      const arg = {};
      cursor.map(arg);
      expect(wrappee.map.calledWith(arg)).to.equal(true);
    });

    it('has the correct metadata', () => {
      expect(cursor.collation.serverVersions).to.deep.equal(['3.4.0', ServerVersions.latest]);
    });
  });
  describe('Cursor Internals', () => {
    const mongo = {
      _batchSize: () => 20
    } as any;
    describe('#addOption', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly adds the cursor flag', () => {
        expect(shellApiCursor.addOption(2)).to.equal(shellApiCursor);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('tailable', true);
      });

      it('throws if a SlaveOk flag passed', () => {
        try {
          shellApiCursor.addOption(4);
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshUnimplementedError);
          expect(e.message).to.contain('the slaveOk option is not supported.');
          expect(e.code).to.equal(CommonErrors.NotImplemented);
        }
      });

      it('throws if an unknown flag passed', () => {
        try {
          shellApiCursor.addOption(123123);
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('Unknown option flag number: 123123');
          expect(e.code).to.equal(CommonErrors.InvalidArgument);
        }
      });
    });

    describe('#allowPartialResults', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly adds the cursor flag', () => {
        expect(shellApiCursor.allowPartialResults()).to.equal(shellApiCursor);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('partial', true);
      });
    });

    describe('#allowDiskUse', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('calls the driver method', () => {
        expect(shellApiCursor.allowDiskUse()).to.equal(shellApiCursor);
        expect(spCursor.allowDiskUse).to.have.been.calledWith();
      });
    });

    describe('#batchSize', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly set the batch size', () => {
        expect(shellApiCursor.batchSize(5)).to.equal(shellApiCursor);
        expect(spCursor.batchSize).to.have.been.calledWith(5);
      });
    });

    describe('#close', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const options = { skipKillCursors: true };

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('closes the cursor', () => {
        shellApiCursor.close(options);
        expect(spCursor.close).to.have.been.calledWith(options);
      });
    });

    describe('#collation', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const coll = { locale: 'en' };

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        spCursor.collation.withArgs(coll as any);
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets the collation', () => {
        expect(shellApiCursor.collation(coll)).to.equal(shellApiCursor);
        expect(spCursor.collation).to.have.been.calledWith(coll);
      });
    });

    describe('#comment', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const cmt = 'hi';

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets the comment', () => {
        expect(shellApiCursor.comment(cmt)).to.equal(shellApiCursor);
        expect(spCursor.comment).to.have.been.calledWith(cmt);
      });
    });

    describe('#count', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        spCursor.count.resolves(5);
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets the count', async() => {
        expect(await shellApiCursor.count()).to.equal(5);
        expect(spCursor.count).to.have.been.calledWith();
      });

      it('is aliased by size()', async() => {
        expect(await shellApiCursor.size()).to.equal(5);
        expect(spCursor.count).to.have.been.calledWith();
      });
    });

    describe('#hasNext', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
        spCursor.hasNext.resolves(true);
      });

      it('returns the cursor hasNext value', async() => {
        expect(await shellApiCursor.hasNext()).to.equal(true);
        expect(spCursor.hasNext).to.have.been.calledWith();
      });
    });

    describe('#tryNext', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
        spCursor.tryNext.resolves({ doc: 1 });
      });

      it('returns the cursor hasNext value', async() => {
        expect(await shellApiCursor.tryNext()).to.deep.equal({ doc: 1 });
        expect(spCursor.tryNext).to.have.been.calledWith();
      });
    });

    describe('#isExhausted', () => {
      let spCursor: any;
      let shellApiCursor: Cursor;

      [ // hasNext, isClosed, expected
        [1, true, false],
        [1, false, false],
        [0, true, true],
        [0, false, false]
      ].forEach(([buffCount, isClosed, expected]) => {
        context(`when cursor.objsLeftInBatch is ${buffCount} and cursor.isClosed is ${isClosed}`, () => {
          beforeEach(() => {
            // NOTE: have to use proxy bc can't stub readonly attributes like closed
            spCursor = new Proxy({} as ServiceProviderCursor, {
              get: (target, prop): any => {
                if (prop === 'closed') {
                  return isClosed;
                }
                if (prop === 'bufferedCount') {
                  return () => buffCount;
                }
                return (target as any).prop;
              }
            });
            shellApiCursor = new Cursor(mongo, spCursor);
          });

          it(`returns ${expected}`, async() => {
            expect(await shellApiCursor.isExhausted()).to.equal(expected);
          });
        });
      });
    });

    describe('#hint', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const index = 'a_1';

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets hint', () => {
        expect(shellApiCursor.hint(index)).to.equal(shellApiCursor);
        expect(spCursor.hint).to.have.been.calledWith(index);
      });
    });

    describe('#limit', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = 6;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets limit', () => {
        expect(shellApiCursor.limit(value)).to.equal(shellApiCursor);
        expect(spCursor.limit).to.have.been.calledWith(value);
      });
    });

    describe('#max', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = { a: 1 };

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets max', () => {
        expect(shellApiCursor.max(value)).to.equal(shellApiCursor);
        expect(spCursor.max).to.have.been.calledWith(value);
      });
    });

    describe('#maxTimeMS', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = 5000;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets maxTimeMS', () => {
        expect(shellApiCursor.maxTimeMS(value)).to.equal(shellApiCursor);
        expect(spCursor.maxTimeMS).to.have.been.calledWith(value);
      });
    });

    describe('#maxAwaitTimeMS', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = 5000;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets maxAwaitTimeMS', () => {
        expect(shellApiCursor.maxAwaitTimeMS(value)).to.equal(shellApiCursor);
        expect(spCursor.maxAwaitTimeMS).to.have.been.calledWith(value);
      });
    });

    describe('#min', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = { a: 1 };

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets min', () => {
        expect(shellApiCursor.min(value)).to.equal(shellApiCursor);
        expect(spCursor.min).to.have.been.calledWith(value);
      });
    });

    describe('#noCursorTimeout', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly adds the cursor flag', () => {
        expect(shellApiCursor.noCursorTimeout()).to.equal(shellApiCursor);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('noCursorTimeout', true);
      });
    });

    describe('#oplogReplay', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly adds the cursor flag', () => {
        expect(shellApiCursor.oplogReplay()).to.equal(shellApiCursor);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('oplogReplay', true);
      });
    });

    describe('#projection', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = { a: 1 };

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets projection', () => {
        expect(shellApiCursor.projection(value)).to.equal(shellApiCursor);
        expect(spCursor.project).to.have.been.calledWith(value);
      });
    });

    describe('#readPref', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      let fromOptionsStub;
      const value = 'primary';
      const tagSet = [{ nodeType: 'ANALYTICS' }];

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
        fromOptionsStub = sinon.stub();
        fromOptionsStub.callsFake(input => input);
        mongo._serviceProvider = {
          readPreferenceFromOptions: fromOptionsStub
        };
      });

      it('fluidly sets the read preference', () => {
        expect(shellApiCursor.readPref(value)).to.equal(shellApiCursor);
        expect(spCursor.withReadPreference).to.have.been.calledWith(value);
      });

      it('fluidly sets the read preference with tagSet and hedge options', () => {
        expect(shellApiCursor.readPref(value, tagSet, { enabled: true })).to.equal(shellApiCursor);
        expect(spCursor.withReadPreference).to.have.been.calledWith({
          readPreference: value,
          readPreferenceTags: tagSet,
          hedge: { enabled: true }
        });
      });
    });

    describe('#readConcern', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = 'local';

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets the read concern', () => {
        expect(shellApiCursor.readConcern(value)).to.equal(shellApiCursor);
        expect(spCursor.withReadConcern).to.have.been.calledWith({ level: value });
      });
    });

    describe('#returnKey', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = true;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets the return key value', () => {
        expect(shellApiCursor.returnKey(value)).to.equal(shellApiCursor);
        expect(spCursor.returnKey).to.have.been.calledWith(value);
      });
    });

    describe('#showRecordId', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = true;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets the return key value', () => {
        expect(shellApiCursor.showRecordId()).to.equal(shellApiCursor);
        expect(spCursor.showRecordId).to.have.been.calledWith(value);
      });
    });

    describe('#objsLeftInBatch', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        spCursor.bufferedCount.returns(100);
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('returns the count', () => {
        expect(shellApiCursor.objsLeftInBatch()).to.equal(100);
        expect(spCursor.bufferedCount).to.have.been.calledWith();
      });
    });

    describe('#skip', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = 6;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets skip', () => {
        expect(shellApiCursor.skip(value)).to.equal(shellApiCursor);
        expect(spCursor.skip).to.have.been.calledWith(value);
      });
    });

    describe('#sort', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;
      const value = { a: 1 };

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly sets sort', () => {
        expect(shellApiCursor.sort(value)).to.equal(shellApiCursor);
        expect(spCursor.sort).to.have.been.calledWith(value);
      });
    });

    describe('#tailable', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('fluidly adds the cursor flag', () => {
        expect(shellApiCursor.tailable()).to.equal(shellApiCursor);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('tailable', true);
      });

      it('fluidly adds the awaitData flag', () => {
        expect(shellApiCursor.tailable({ awaitData: true })).to.equal(shellApiCursor);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('tailable', true);
        expect(spCursor.addCursorFlag).to.have.been.calledWith('awaitData', true);
      });
    });

    describe('#itcount', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('returns the iteration count', async() => {
        spCursor.tryNext.onCall(0).resolves(true);
        spCursor.tryNext.onCall(1).resolves(true);
        spCursor.tryNext.onCall(2).resolves(null);

        expect(await shellApiCursor.itcount()).to.equal(2);
      });
    });

    describe('#explain', () => {
      let nativeCursorStub;
      let shellApiCursor;

      beforeEach(() => {
        nativeCursorStub = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, nativeCursorStub);
      });

      it('calls explain on the cursor', async() => {
        nativeCursorStub.explain.resolves({
          queryPlanner: { },
          executionStats: {
            allPlansExecution: [ ]
          },
          serverInfo: { },
          ok: 1
        });

        const explained = await shellApiCursor.explain();
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect(nativeCursorStub.explain).to.have.been.calledWith();
      });

      it('does not throw if executionStats is missing', async() => {
        nativeCursorStub.explain.resolves({
          queryPlanner: { },
          serverInfo: { },
          ok: 1
        });

        await shellApiCursor.explain();
      });

      context('with empty verbosity', () => {
        it('filters out executionStats', async() => {
          nativeCursorStub.explain.resolves({
            queryPlanner: { },
            executionStats: {
              allPlansExecution: [ ]
            },
            serverInfo: { },
            ok: 1
          });
          expect(await shellApiCursor.explain()).to.deep.equal({
            queryPlanner: { },
            serverInfo: { },
            ok: 1
          });
        });
      });

      context('with verbosity = queryPlanner', () => {
        it('filters out executionStats', async() => {
          nativeCursorStub.explain.resolves({
            queryPlanner: { },
            executionStats: {
              allPlansExecution: [ ]
            },
            serverInfo: { },
            ok: 1
          });
          expect(await shellApiCursor.explain('queryPlanner')).to.deep.equal({
            queryPlanner: { },
            serverInfo: { },
            ok: 1
          });
        });
      });

      context('with verbosity = executionStats', () => {
        it('filters out allPlansExecution', async() => {
          nativeCursorStub.explain.resolves({
            queryPlanner: { },
            executionStats: {
              allPlansExecution: [ ]
            },
            serverInfo: { },
            ok: 1
          });
          expect(await shellApiCursor.explain('executionStats')).to.deep.equal({
            queryPlanner: { },
            executionStats: { },
            serverInfo: { },
            ok: 1
          });
        });
      });

      context('with verbosity = allPlansExecution', () => {
        it('returns everything', async() => {
          nativeCursorStub.explain.resolves({
            queryPlanner: { },
            executionStats: {
              allPlansExecution: [ ]
            },
            serverInfo: { },
            ok: 1
          });
          expect(await shellApiCursor.explain('allPlansExecution')).to.deep.equal({
            queryPlanner: { },
            executionStats: {
              allPlansExecution: [ ]
            },
            serverInfo: { },
            ok: 1
          });
        });
      });
    });

    describe('#maxScan', () => {
      let spCursor: StubbedInstance<ServiceProviderCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<ServiceProviderCursor>();
        shellApiCursor = new Cursor(mongo, spCursor);
      });

      it('throws a helpful exception regarding its removal', () => {
        try {
          shellApiCursor.maxScan();
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshDeprecatedError);
          expect(e.message).to.contain('`maxScan()` was removed because it was deprecated in MongoDB 4.0');
        }
      });
    });

    describe('toShellResult', () => {
      let shellApiCursor;
      let i;

      beforeEach(() => {
        i = 0;
        // NOTE: Have to use proxy bc can't stub readonly inherited property
        const proxyCursor = new Proxy({} as ServiceProviderCursor, {
          get: (target, prop): any => {
            if (prop === 'closed') {
              return false;
            }
            if (prop === 'tryNext') {
              return async() => ({ key: i++ });
            }
            if (prop === 'batchSize') {
              return () => {};
            }
            return (target as any)[prop];
          }
        });
        shellApiCursor = new Cursor(mongo, proxyCursor);
      });

      it('is idempotent unless iterated', async() => {
        const result1 = (await toShellResult(shellApiCursor)).printable;
        const result2 = (await toShellResult(shellApiCursor)).printable;
        expect(result1).to.deep.equal(result2);
        expect(i).to.equal(20);
        await shellApiCursor._it();
        const result3 = (await toShellResult(shellApiCursor)).printable;
        expect(result1).to.not.deep.equal(result3);
        expect(i).to.equal(40);
      });

      it('lets .batchSize() control the output length', async() => {
        shellApiCursor.batchSize(10);
        const result = (await toShellResult(shellApiCursor)).printable;
        expect(i).to.equal(10);
        expect(result).to.have.nested.property('documents.length', 10);
      });
    });
  });
});

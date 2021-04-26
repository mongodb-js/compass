import { expect } from 'chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { signatures, toShellResult } from './index';
import AggregationCursor from './aggregation-cursor';
import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import { ReplPlatform, AggregationCursor as SPAggregationCursor } from '@mongosh/service-provider-core';

describe('AggregationCursor', () => {
  describe('help', () => {
    const apiClass = new AggregationCursor({
      _serviceProvider: { platform: ReplPlatform.CLI }
    } as any, {} as SPAggregationCursor);
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('signature', () => {
    it('signature for class correct', () => {
      expect(signatures.AggregationCursor.type).to.equal('AggregationCursor');
      expect(signatures.AggregationCursor.hasAsyncChild).to.equal(true);
    });
    it('map signature', () => {
      expect(signatures.AggregationCursor.attributes.map).to.deep.equal({
        type: 'function',
        returnsPromise: false,
        deprecated: false,
        returnType: 'AggregationCursor',
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
      cursor = new AggregationCursor({
        _serviceProvider: { platform: ReplPlatform.CLI },
        _batchSize: () => 20
      } as any, wrappee);
    });

    it('sets dynamic properties', async() => {
      expect((await toShellResult(cursor)).type).to.equal('AggregationCursor');
      expect((await toShellResult(cursor._it())).type).to.equal('CursorIterationResult');
      expect((await toShellResult(cursor)).printable).to.deep.equal({
        documents: [],
        cursorHasMore: false
      });
      expect((await toShellResult(cursor.help)).type).to.equal('Help');
    });

    it('returns the same cursor', () => {
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
  });

  describe('Cursor Internals', () => {
    const mongo = {
      _batchSize: () => 20
    } as any;
    describe('#close', () => {
      let spCursor: StubbedInstance<SPAggregationCursor>;
      let shellApiCursor;
      const options = { skipKillCursors: true };

      beforeEach(() => {
        spCursor = stubInterface<SPAggregationCursor>();
        shellApiCursor = new AggregationCursor(mongo, spCursor);
      });

      it('closes the cursor', () => {
        shellApiCursor.close(options);
        expect(spCursor.close).to.have.been.calledWith(options);
      });
    });

    describe('#hasNext', () => {
      let spCursor: StubbedInstance<SPAggregationCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<SPAggregationCursor>();
        shellApiCursor = new AggregationCursor(mongo, spCursor);
        spCursor.hasNext.resolves(true);
      });

      it('returns the cursor hasNext value', async() => {
        expect(await shellApiCursor.hasNext()).to.equal(true);
        expect(spCursor.hasNext).to.have.been.calledWith();
      });
    });

    describe('#tryNext', () => {
      let spCursor: StubbedInstance<SPAggregationCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<SPAggregationCursor>();
        shellApiCursor = new AggregationCursor(mongo, spCursor);
        spCursor.tryNext.resolves({ doc: 1 });
      });

      it('returns the cursor hasNext value', async() => {
        expect(await shellApiCursor.tryNext()).to.deep.equal({ doc: 1 });
        expect(spCursor.tryNext).to.have.been.calledWith();
      });
    });

    describe('#isExhausted', () => {
      let spCursor: any;
      let shellApiCursor: AggregationCursor;

      [ // hasNext, isClosed, expected
        [1, true, false],
        [1, false, false],
        [0, true, true],
        [0, false, false]
      ].forEach(([buffCount, isClosed, expected]) => {
        context(`when cursor.objsLeftInBatch is ${buffCount} and cursor.isClosed is ${isClosed}`, () => {
          beforeEach(() => {
            // NOTE: have to use proxy bc can't stub readonly attributes like closed
            spCursor = new Proxy({} as SPAggregationCursor, {
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
            shellApiCursor = new AggregationCursor(mongo, spCursor);
          });

          it(`returns ${expected}`, async() => {
            expect(await shellApiCursor.isExhausted()).to.equal(expected);
          });
        });
      });
    });

    describe('#objsLeftInBatch', () => {
      let spCursor: StubbedInstance<SPAggregationCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<SPAggregationCursor>();
        spCursor.bufferedCount.returns(100);
        shellApiCursor = new AggregationCursor(mongo, spCursor);
      });

      it('returns the count', () => {
        expect(shellApiCursor.objsLeftInBatch()).to.equal(100);
        expect(spCursor.bufferedCount).to.have.been.calledWith();
      });
    });

    describe('#itcount', () => {
      let spCursor: StubbedInstance<SPAggregationCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<SPAggregationCursor>();
        shellApiCursor = new AggregationCursor(mongo, spCursor);
      });

      it('returns the iteration count', async() => {
        spCursor.tryNext.onCall(0).resolves(true);
        spCursor.tryNext.onCall(1).resolves(true);
        spCursor.tryNext.onCall(2).resolves(null);

        expect(await shellApiCursor.itcount()).to.equal(2);
      });
    });

    describe('#explain', () => {
      let spCursor: StubbedInstance<SPAggregationCursor>;
      let shellApiCursor;

      beforeEach(() => {
        spCursor = stubInterface<SPAggregationCursor>();
        shellApiCursor = new AggregationCursor(mongo, spCursor);
        spCursor.explain.resolves({ ok: 1 });
      });

      it('returns an ExplainOutput object', async() => {
        const explained = await shellApiCursor.explain();
        expect(spCursor.explain).to.have.been.calledWith('queryPlanner');
        expect((await toShellResult(explained)).type).to.equal('ExplainOutput');
        expect((await toShellResult(explained)).printable).to.deep.equal({ ok: 1 });
      });
    });

    describe('toShellResult', () => {
      let shellApiCursor;
      let i;

      beforeEach(() => {
        i = 0;
        // NOTE: Have to use proxy bc can't stub readonly inherited property
        const proxyCursor = new Proxy({} as SPAggregationCursor, {
          get: (target, prop): any => {
            if (prop === 'closed') {
              return false;
            }
            if (prop === 'tryNext') {
              return async() => ({ key: i++ });
            }
            return (target as any)[prop];
          }
        });
        shellApiCursor = new AggregationCursor(mongo, proxyCursor);
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

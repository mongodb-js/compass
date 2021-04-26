import { expect } from 'chai';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import { EventEmitter } from 'events';
import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import { signatures, toShellResult } from './index';
import Database from './database';
import Cursor from './cursor';
import Mongo from './mongo';
import Collection from './collection';
import Explainable from './explainable';
import { ServiceProvider, bson } from '@mongosh/service-provider-core';
import ShellInternalState from './shell-internal-state';
import { CommonErrors, MongoshInvalidInputError } from '@mongosh/errors';

describe('Explainable', () => {
  describe('help', () => {
    const apiClass = new Explainable({} as any, {} as any, 'queryPlannerExtended');
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.Explainable.type).to.equal('Explainable');
    });
    it('attributes', () => {
      expect(signatures.Explainable.attributes.find).to.deep.equal({
        type: 'function',
        returnsPromise: false,
        deprecated: false,
        returnType: 'ExplainableCursor',
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
    it('hasAsyncChild', () => {
      expect(signatures.Explainable.hasAsyncChild).to.equal(true);
    });
  });
  describe('metadata', () => {
    const mongo: any = { _internalState: { emitApiCall: sinon.spy() } };
    const db = new Database(mongo, 'myDB');
    const coll = new Collection(mongo, db, 'myCollection');
    const explainable = new Explainable(mongo, coll, 'queryPlannerExtended');
    it('toShellResult', async() => {
      const result = await toShellResult(explainable);
      expect(result.type).to.equal('Explainable');
      expect(result.printable).to.equal('Explainable(myDB.myCollection)');
    });
  });
  describe('commands', () => {
    let mongo: Mongo;
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let database: Database;
    let bus: StubbedInstance<EventEmitter>;
    let internalState: ShellInternalState;
    let collection: Collection;
    let explainable: Explainable;

    beforeEach(() => {
      bus = stubInterface<EventEmitter>();
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      internalState = new ShellInternalState(serviceProvider, bus);
      mongo = new Mongo(internalState, undefined, undefined, undefined, serviceProvider);
      database = new Database(mongo, 'db1');
      collection = new Collection(mongo, database, 'coll1');
      explainable = new Explainable(mongo, collection, 'queryPlanner');
    });
    describe('getCollection', () => {
      it('returns the explainable collection', () => {
        expect(
          explainable.getCollection()
        ).to.equal(collection);
      });
    });

    describe('getVerbosity', () => {
      it('returns the explainable verbosity', () => {
        expect(
          explainable.getVerbosity()
        ).to.equal('queryPlanner');
      });
    });

    describe('setVerbosity', () => {
      it('sets the explainable verbosity', () => {
        expect(explainable._verbosity).not.to.equal('allPlansExecution');
        explainable.setVerbosity('allPlansExecution');
        expect(explainable._verbosity).to.equal('allPlansExecution');
      });

      it('validates the verbosity', () => {
        try {
          explainable.setVerbosity('badVerbosityArgument' as any);
          expect.fail('expected error');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('verbosity can only be one of queryPlanner, executionStats, allPlansExecution. Received badVerbosityArgument.');
          expect(e.code).to.equal(CommonErrors.InvalidArgument);
        }
      });
    });

    describe('find', () => {
      let cursorStub;
      let explainResult;
      beforeEach(async() => {
        explainResult = { ok: 1 };

        const cursorSpy = {
          explain: sinon.spy(() => explainResult)
        } as unknown;
        collection.find = sinon.spy(() => (cursorSpy as Cursor));

        cursorStub = await explainable.find(
          { query: 1 },
          { projection: 1 }
        );
      });

      it('calls collection.find with arguments', () => {
        expect(collection.find).to.have.been.calledOnceWithExactly(
          { query: 1 },
          { projection: 1 }
        );
      });

      it('returns an cursor that has toShellResult when evaluated', async() => {
        expect((await toShellResult(cursorStub)).type).to.equal('ExplainableCursor');
      });

      context('when calling toShellResult().printable on the result', () => {
        it('calls explain with verbosity', async() => {
          expect(cursorStub._verbosity).to.equal('queryPlanner');
        });

        it('returns the explain result', async() => {
          expect(
            (await toShellResult(cursorStub)).printable
          ).to.equal(explainResult);
        });
      });
    });

    describe('aggregate', () => {
      let explainResult;
      const expectedExplainResult = { ok: 1 };
      beforeEach(async() => {
        collection.aggregate = sinon.spy(() => Promise.resolve(expectedExplainResult)) as any;

        explainResult = await explainable.aggregate(
          { pipeline: 1 },
          { aggregate: 1 }
        );
      });

      it('calls collection.aggregate with arguments', () => {
        expect(collection.aggregate).to.have.been.calledOnceWithExactly(
          { pipeline: 1 },
          { aggregate: 1, explain: 'queryPlanner' }
        );
      });

      it('returns the explain result', () => {
        expect(explainResult).to.equal(expectedExplainResult);
      });
    });
  });
});

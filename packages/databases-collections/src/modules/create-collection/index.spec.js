import { expect } from 'chai';
import sinon from 'sinon';
import reducer, {
  createCollection as makeCreateCollection,
  handleFLE2Options,
} from './index';
import { reset } from '../reset';
import { UUID } from 'bson';

import { CLEAR_ERROR, HANDLE_ERROR } from '../error';

import { TOGGLE_IS_RUNNING } from '../is-running';

import { RESET } from '../reset';

describe('create collection module', function () {
  describe('#reducer', function () {
    context('when an action is provided', function () {
      context('when the action is reset', function () {
        const dataService = 'data-service';

        it('returns the reset state', function () {
          expect(reducer({ dataService }, reset())).to.deep.equal({
            databaseName: '',
            dataService: 'data-service',
            error: null,
            isRunning: false,
            isVisible: false,
          });
        });
      });
    });
  });

  describe('#createCollection', function () {
    let appRegistryEmitSpy;
    const hadronAppBkp = global.hadronApp;

    beforeEach(function () {
      appRegistryEmitSpy = sinon.spy();
      global.hadronApp = {
        appRegistry: { emit: appRegistryEmitSpy },
      };
    });

    afterEach(function () {
      global.hadronApp = hadronAppBkp;
    });

    const testCreateCollection = async (createCollectionSpy, state, data) => {
      const dispatched = [];
      await makeCreateCollection(data)(
        (evt) => {
          dispatched.push(evt);
        },
        () => ({
          dataService: {
            dataService: {
              createCollection: createCollectionSpy,
            },
          },
          ...state,
        })
      );

      return dispatched;
    };

    it('creates a simple collection', async function () {
      const createCollectionSpy = sinon.spy((ns, options, cb) => cb(null, {}));

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        { collection: 'coll1', options: {} }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {});
      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: RESET },
      ]);
    });

    it('creates a capped collection', async function () {
      const createCollectionSpy = sinon.spy((ns, options, cb) => cb(null, {}));

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            capped: true,
            size: 123,
          },
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        capped: true,
        size: 123,
      });

      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: RESET },
      ]);
    });

    it('creates a time-series collection', async function () {
      const createCollectionSpy = sinon.spy((ns, options, cb) => cb(null, {}));

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            timeseries: { timeField: 't' },
          },
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        timeseries: { timeField: 't' },
      });

      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: RESET },
      ]);
    });

    it('creates a time-series collection with collation', async function () {
      const createCollectionSpy = sinon.spy((ns, options, cb) => cb(null, {}));

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            timeseries: {
              timeField: 'timeFieldName',
            },
            collation: { locale: 'es' },
          },
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        timeseries: {
          timeField: 'timeFieldName',
        },
        collation: { locale: 'es' },
      });

      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: RESET },
      ]);
    });

    it('creates a collection with collation', async function () {
      const createCollectionSpy = sinon.spy((ns, options, cb) => cb(null, {}));

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        { databaseName: 'db1' },
        {
          collection: 'coll1',
          options: {
            collation: { locale: 'es' },
          },
        }
      );

      expect(createCollectionSpy).have.been.calledWith('db1.coll1', {
        collation: { locale: 'es' },
      });

      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: RESET },
      ]);
    });

    it('handles errors from data service', async function () {
      const err = new Error('error');
      const createCollectionSpy = sinon.spy((ns, options, cb) => cb(err));

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        {},
        {}
      );

      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: TOGGLE_IS_RUNNING, isRunning: false },
        { type: HANDLE_ERROR, error: err },
      ]);
    });

    it('handles synchronous exceptions', async function () {
      const err = new Error('error');
      const createCollectionSpy = sinon.spy(() => {
        throw err;
      });

      const dispatched = await testCreateCollection(
        createCollectionSpy,
        {},
        {}
      );

      expect(dispatched).to.deep.equal([
        { type: CLEAR_ERROR },
        { type: TOGGLE_IS_RUNNING, isRunning: true },
        { type: TOGGLE_IS_RUNNING, isRunning: false },
        { type: HANDLE_ERROR, error: err },
      ]);
    });
  });

  describe('#handleFLE2Options', function () {
    let ds;
    let uuid;

    beforeEach(function () {
      uuid = new UUID().toBinary();
      ds = {
        createDataKey: sinon.stub().resolves(uuid),
      };
    });

    it('parses an encryptedFields config', async function () {
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '',
        })
      ).to.deep.equal({});
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{}',
        })
      ).to.deep.equal({});
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{ foo: "bar" }',
        })
      ).to.deep.equal({ encryptedFields: { foo: 'bar' } });
    });

    it('rejects unparseable encryptedFields config', async function () {
      try {
        await handleFLE2Options(ds, {
          encryptedFields: '{',
        });
        expect.fail('missed exception');
      } catch (err) {
        expect(err.message).to.include(
          'Could not parse encryptedFields config'
        );
      }
    });

    it('creates data keys for missing fields if kms and key encryption key are provided', async function () {
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{ fields: [{ path: "foo", bsonType: "string" }] }',
          kmsProvider: 'local',
          keyEncryptionKey: '',
        })
      ).to.deep.equal({
        encryptedFields: {
          fields: [{ path: 'foo', bsonType: 'string', keyId: uuid }],
        },
      });
    });

    it('does not create data keys if encryptedFields.fields is not an array', async function () {
      expect(
        await handleFLE2Options(ds, {
          encryptedFields: '{ fields: {x: "y"} }',
          kmsProvider: 'local',
          keyEncryptionKey: '',
        })
      ).to.deep.equal({
        encryptedFields: {
          fields: { x: 'y' },
        },
      });
    });

    it('fails when creating data keys fails', async function () {
      ds.createDataKey.rejects(new Error('createDataKey failed'));
      try {
        await handleFLE2Options(ds, {
          encryptedFields: '{ fields: [{ path: "foo", bsonType: "string" }] }',
          kmsProvider: 'local',
          keyEncryptionKey: '',
        });
        expect.fail('missed exception');
      } catch (err) {
        expect(err.message).to.equal('createDataKey failed');
      }
    });
  });
});

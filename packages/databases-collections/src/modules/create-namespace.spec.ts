import { expect } from 'chai';
import sinon from 'sinon';
import reducer, {
  type OpenAction,
  INITIAL_STATE,
  clearError,
  close,
  handleError,
  handleFLE2Options,
  kmsProvidersRetrieved,
  open,
  reset,
  serverVersionRetrieved,
  toggleIsRunning,
  topologyChanged,
} from './create-namespace';
import type { Binary } from 'bson';
import { UUID } from 'bson';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';

describe('create collection module', function () {
  describe('#reducer', function () {
    it('reduces ResetAction', function () {
      const state = reducer(undefined, reset());
      expect(state).to.deep.equal(INITIAL_STATE);
    });

    it('reduces OpenAction and CloseAction', function () {
      let storeAction: OpenAction = {} as OpenAction;
      open('1')(
        (action: any) => {
          storeAction = action;
        },
        () => INITIAL_STATE,
        {
          track: createNoopTrack(),
          connections: {
            getConnectionById: () => ({ info: { id: 'TEST' } }),
          },
        } as any
      );
      const state = reducer(undefined, storeAction);
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        connectionId: '1',
        databaseName: null,
        isVisible: true,
      });

      const nextState = reducer(state, close());
      expect(nextState).to.deep.equal(INITIAL_STATE);
    });

    it('reduces OpenAction for a collection', function () {
      let storeAction: OpenAction = {} as OpenAction;
      // opening this modal for creating a collection requires passing dbName
      open('1', 'db')(
        (action: any) => {
          storeAction = action;
        },
        () => INITIAL_STATE,
        {
          track: createNoopTrack(),
          connections: {
            getConnectionById: () => ({ info: { id: 'TEST' } }),
          },
        } as any
      );
      const state = reducer(undefined, storeAction);
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        connectionId: '1',
        databaseName: 'db',
        isVisible: true,
      });
    });

    it('reduces HandleErrorAction and ClearErrorAction', function () {
      const err = new Error('oops');
      const state = reducer(undefined, handleError(err));
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        error: err,
      });

      const nextState = reducer(state, clearError());
      expect(nextState).to.deep.equal({
        ...state,
        error: null,
      });
    });

    it('reduces ToggleIsRunningAction', function () {
      const state = reducer(undefined, toggleIsRunning(true));
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        isRunning: true,
      });

      const nextState = reducer(state, toggleIsRunning(false));
      expect(nextState).to.deep.equal({
        ...state,
        isRunning: false,
      });
    });

    it('reduces TopologyChangedAction', function () {
      const state = reducer(undefined, topologyChanged('1', 'something'));
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        connectionMetaData: {
          '1': {
            currentTopologyType: 'something',
          },
        },
      });
    });

    it('reduces ServerVersionRetrievedAction', function () {
      const state = reducer(undefined, serverVersionRetrieved('1', '0.0.0'));
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        connectionMetaData: {
          '1': {
            serverVersion: '0.0.0',
          },
        },
      });
    });

    it('reduces KMSProvidersRetrievedAction', function () {
      const state = reducer(undefined, kmsProvidersRetrieved('1', ['x']));
      expect(state).to.deep.equal({
        ...INITIAL_STATE,
        connectionMetaData: {
          '1': {
            configuredKMSProviders: ['x'],
          },
        },
      });
    });
  });

  describe('#handleFLE2Options', function () {
    let ds: { createDataKey: sinon.SinonStub<any[], Promise<Binary>> };
    let uuid: Binary;

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
        expect((err as Error).message).to.include(
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
        expect((err as Error).message).to.equal('createDataKey failed');
      }
    });
  });
});

import { MongoshInvalidInputError } from '@mongosh/errors';
import { bson, ClientEncryption as FLEClientEncryption, ServiceProvider } from '@mongosh/service-provider-core';
import { expect } from 'chai';
import { EventEmitter } from 'events';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import Database from './database';
import { signatures, toShellResult } from './decorators';
import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import { ClientEncryption, ClientSideFieldLevelEncryptionOptions, ClientSideFieldLevelEncryptionKmsProvider as KMSProvider, KeyVault } from './field-level-encryption';
import Mongo from './mongo';
import { DeleteResult } from './result';
import ShellInternalState from './shell-internal-state';
import { CliServiceProvider } from '../../service-provider-server';
import { startTestServer } from '../../../testing/integration-testing-hooks';
import { makeFakeHTTPConnection, fakeAWSHandlers } from '../../../testing/fake-kms';

const KEY_ID = new bson.Binary('MTIzNA==');
const DB = 'encryption';
const COLL = 'keys';
const SCHEMA_MAP = {
  'fle-example.people': {
    'properties': {
      'ssn': {
        'encrypt': {
          'keyId': '/keyAltName',
          'bsonType': 'string',
          'algorithm': 'AEAD_AES_256_CBC_HMAC_SHA_512-Random'
        }
      }
    },
    'bsonType': 'object'
  }
};
const AWS_KMS = {
  keyVaultNamespace: `${DB}.${COLL}`,
  kmsProviders: {
    aws: {
      accessKeyId: 'abc',
      secretAccessKey: '123'
    }
  },
  schemaMap: SCHEMA_MAP,
  bypassAutoEncryption: true
};

const ALGO = 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic';

const RAW_CLIENT = { client: 1 } as any;

describe('Field Level Encryption', () => {
  let sp: StubbedInstance<ServiceProvider>;
  let mongo: Mongo;
  let internalState: ShellInternalState;
  let libmongoc: StubbedInstance<FLEClientEncryption>;
  let clientEncryption: ClientEncryption;
  let keyVault: KeyVault;
  let clientEncryptionSpy;
  describe('Metadata', () => {
    before(() => {
      libmongoc = stubInterface<FLEClientEncryption>();
      sp = stubInterface<ServiceProvider>();
      sp.bsonLibrary = bson;
      sp.fle = {
        ClientEncryption: function() { return libmongoc; }
      } as any;
      sp.initialDb = 'test';
      internalState = new ShellInternalState(sp, stubInterface<EventEmitter>());
      internalState.currentDb = stubInterface<Database>();
      mongo = new Mongo(internalState, 'localhost:27017', AWS_KMS, undefined, sp);
      clientEncryption = new ClientEncryption(mongo);
      keyVault = new KeyVault(clientEncryption);
    });
    it('calls help function', async() => {
      expect((await toShellResult(clientEncryption.help())).type).to.equal('Help');
      expect((await toShellResult(clientEncryption.help)).type).to.equal('Help');
      expect((await toShellResult(keyVault.help())).type).to.equal('Help');
      expect((await toShellResult(keyVault.help)).type).to.equal('Help');
    });
    it('calls print function', async() => {
      expect((await toShellResult(clientEncryption)).printable).to.equal('ClientEncryption class for mongodb://localhost:27017/test?directConnection=true&serverSelectionTimeoutMS=2000');
      expect((await toShellResult(keyVault)).printable).to.equal('KeyVault class for mongodb://localhost:27017/test?directConnection=true&serverSelectionTimeoutMS=2000');
    });
    it('has metadata type', async() => {
      expect((await toShellResult(clientEncryption)).type).to.equal('ClientEncryption');
      expect((await toShellResult(keyVault)).type).to.equal('KeyVault');
    });
  });
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.KeyVault.type).to.equal('KeyVault');
      expect(signatures.ClientEncryption.type).to.equal('ClientEncryption');
    });
    it('attributes', () => {
      expect(signatures.KeyVault.attributes.createKey).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { attributes: {}, type: 'unknown' },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ClientEncryption.attributes.encrypt).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { attributes: {}, type: 'unknown' },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
    it('hasAsyncChild', () => {
      expect(signatures.KeyVault.hasAsyncChild).to.equal(true);
      expect(signatures.ClientEncryption.hasAsyncChild).to.equal(true);
    });
  });
  describe('commands', () => {
    beforeEach(() => {
      clientEncryptionSpy = sinon.spy();
      libmongoc = stubInterface<FLEClientEncryption>();
      sp = stubInterface<ServiceProvider>();
      sp.getRawClient.returns(RAW_CLIENT);
      sp.bsonLibrary = bson;
      sp.fle = {
        ClientEncryption: function(...args) {
          clientEncryptionSpy(...args);
          return libmongoc;
        }
      } as any;
      sp.initialDb = 'test';
      internalState = new ShellInternalState(sp, stubInterface<EventEmitter>());
      internalState.currentDb = stubInterface<Database>();
      mongo = new Mongo(internalState, 'localhost:27017', AWS_KMS, undefined, sp);
      clientEncryption = new ClientEncryption(mongo);
      keyVault = new KeyVault(clientEncryption);
    });
    describe('constructor', () => {
      it('constructs ClientEncryption with correct options', () => {
        expect(sp.getRawClient.getCalls().length).to.equal(1); // called for ClientEncryption construction
        expect(clientEncryptionSpy).to.have.been.calledOnceWithExactly(
          RAW_CLIENT,
          {
            keyVaultClient: undefined,
            keyVaultNamespace: AWS_KMS.keyVaultNamespace,
            kmsProviders: AWS_KMS.kmsProviders,
            bypassAutoEncryption: AWS_KMS.bypassAutoEncryption,
            schemaMap: AWS_KMS.schemaMap
          }
        );
      });
    });
    describe('encrypt', () => {
      it('calls encrypt on libmongoc', async() => {
        const value = new bson.ObjectId();
        libmongoc.encrypt.resolves();
        await clientEncryption.encrypt(KEY_ID, value, ALGO);
        expect(libmongoc.encrypt).calledOnceWithExactly(value, { keyId: KEY_ID, algorithm: ALGO });
      });
      it('throw if failed', async() => {
        const value = new bson.ObjectId();
        const expectedError = new Error();
        libmongoc.encrypt.rejects(expectedError);
        const caughtError = await clientEncryption.encrypt(KEY_ID, value, ALGO)
          .catch(e => e);
        expect(caughtError).to.equal(expectedError);
      });
    });
    describe('decrypt', () => {
      it('calls decrypt on libmongoc', async() => {
        const raw = 'decrypted';
        libmongoc.decrypt.resolves(raw);
        const result = await clientEncryption.decrypt(KEY_ID);
        expect(libmongoc.decrypt).calledOnceWithExactly(KEY_ID);
        expect(result).to.equal(raw);
      });
      it('throw if failed', async() => {
        const expectedError = new Error();
        libmongoc.decrypt.rejects(expectedError);
        const caughtError = await clientEncryption.decrypt(KEY_ID)
          .catch(e => e);
        expect(caughtError).to.equal(expectedError);
      });
    });
    describe('createKey', () => {
      beforeEach(() => {
        // This can/should be removed once https://jira.mongodb.org/browse/NODE-3118 is fixed
        sinon.replace(keyVault, 'getKey', sinon.fake(() => {
          return { next() { return { keyAltNames: ['altname'] }; } };
        }));
      });
      afterEach(() => {
        sinon.restore();
      });
      it('calls createDataKey on libmongoc with no key for local', async() => {
        const raw = { result: 1 };
        const kms = 'local';
        libmongoc.createDataKey.resolves(raw);
        const result = await keyVault.createKey('local');
        expect(libmongoc.createDataKey).calledOnceWithExactly(kms, undefined);
        expect(result).to.deep.equal(raw);
      });
      it('calls createDataKey on libmongoc with doc key', async() => {
        const raw = { result: 1 };
        const masterKey = { region: 'us-east-1', key: 'masterkey' };
        const keyAltNames = ['keyaltname'];
        libmongoc.createDataKey.resolves(raw);
        const result = await keyVault.createKey('aws', masterKey, keyAltNames);
        expect(libmongoc.createDataKey).calledOnceWithExactly('aws', { masterKey, keyAltNames });
        expect(result).to.deep.equal(raw);
      });
      it('throw if failed', async() => {
        const masterKey = { region: 'us-east-1', key: 'masterkey' };
        const keyAltNames = ['keyaltname'];
        const expectedError = new Error();
        libmongoc.createDataKey.rejects(expectedError);
        const caughtError = await keyVault.createKey('aws', masterKey, keyAltNames)
          .catch(e => e);
        expect(caughtError).to.equal(expectedError);
      });
      it('supports the old local-masterKey combination', async() => {
        const raw = { result: 1 };
        const kms = 'local';
        libmongoc.createDataKey.resolves(raw);
        const result = await keyVault.createKey('local', '');
        expect(libmongoc.createDataKey).calledOnceWithExactly(kms, undefined);
        expect(result).to.deep.equal(raw);
      });
      it('supports the old local-keyAltNames combination', async() => {
        const raw = { result: 1 };
        const kms = 'local';
        const keyAltNames = ['keyaltname'];
        libmongoc.createDataKey.resolves(raw);
        const result = await keyVault.createKey('local', keyAltNames);
        expect(libmongoc.createDataKey).calledOnceWithExactly(kms, { keyAltNames });
        expect(result).to.deep.equal(raw);
      });
      it('supports the old local-masterKey-keyAltNames combination', async() => {
        const raw = { result: 1 };
        const kms = 'local';
        const keyAltNames = ['keyaltname'];
        libmongoc.createDataKey.resolves(raw);
        const result = await keyVault.createKey('local', '', keyAltNames);
        expect(libmongoc.createDataKey).calledOnceWithExactly(kms, { keyAltNames });
        expect(result).to.deep.equal(raw);
      });
      it('throws if alt names are given as second arg for non-local', async() => {
        const raw = { result: 1 };
        libmongoc.createDataKey.resolves(raw);
        try {
          await keyVault.createKey('aws' as any, ['altkey']);
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('requires masterKey to be given as second argument');
          return;
        }
        expect.fail('Expected error');
      });
      it('throws if array is given twice', async() => {
        const raw = { result: 1 };
        libmongoc.createDataKey.resolves(raw);
        try {
          await keyVault.createKey('local', ['altkey'] as any, ['altkeyx']);
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('array for the masterKey and keyAltNames');
          return;
        }
        expect.fail('Expected error');
      });
      it('throws if old AWS style key is created', async() => {
        const raw = { result: 1 };
        libmongoc.createDataKey.resolves(raw);
        try {
          await keyVault.createKey('aws', 'oldstyle');
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('For AWS please use createKey');
          return;
        }
        expect.fail('Expected error');
      });
      it('throws if old AWS style key is created with altNames', async() => {
        const raw = { result: 1 };
        libmongoc.createDataKey.resolves(raw);
        try {
          await keyVault.createKey('aws', 'oldstyle', ['altname']);
        } catch (e) {
          expect(e).to.be.instanceOf(MongoshInvalidInputError);
          expect(e.message).to.contain('For AWS please use createKey');
          return;
        }
        expect.fail('Expected error');
      });
    });
    describe('getKey', () => {
      it('calls find on key coll', () => {
        const c = { cursor: 1 } as any;
        sp.find.returns(c);
        const result = keyVault.getKey(KEY_ID);
        expect(sp.find).to.have.been.calledOnceWithExactly(DB, COLL, { _id: KEY_ID }, {});
        expect(result._cursor).to.deep.equal(c);
      });
    });
    describe('getKeyByAltName', () => {
      it('calls find on key coll', () => {
        const c = { cursor: 1 } as any;
        const keyaltname = 'abc';
        sp.find.returns(c);
        const result = keyVault.getKeyByAltName(keyaltname);
        expect(sp.find).to.have.been.calledOnceWithExactly(DB, COLL, { keyAltNames: keyaltname }, {});
        expect(result._cursor).to.deep.equal(c);
      });
    });
    describe('getKeys', () => {
      it('calls find on key coll', () => {
        const c = { cursor: 1 } as any;
        sp.find.returns(c);
        const result = keyVault.getKeys();
        expect(sp.find).to.have.been.calledOnceWithExactly(DB, COLL, {}, {});
        expect(result._cursor).to.deep.equal(c);
      });
    });
    describe('deleteKey', () => {
      it('calls deleteOne on key coll', async() => {
        const r = { acknowledged: 1, deletedCount: 1 } as any;
        sp.deleteOne.resolves(r);
        const result = await keyVault.deleteKey(KEY_ID);
        expect(sp.deleteOne).to.have.been.calledOnceWithExactly(DB, COLL, { _id: KEY_ID }, {});
        expect(result).to.deep.equal(new DeleteResult(true, 1));
      });
    });
    describe('addKeyAlternateName', () => {
      it('calls findOneAndUpdate on key coll', async() => {
        const r = { value: { ok: 1 } } as any;
        sp.findOneAndUpdate.resolves(r);
        const result = await keyVault.addKeyAlternateName(KEY_ID, 'altname');
        expect(sp.findOneAndUpdate).to.have.been.calledOnceWithExactly(
          DB,
          COLL,
          { _id: KEY_ID },
          { $push: { 'keyAltNames': 'altname' }, $currentDate: { 'updateDate': true } },
          { returnOriginal: true }
        );
        expect(result).to.deep.equal({ ok: 1 });
      });
    });
    describe('removeKeyAlternateName', () => {
      it('calls findOneAndUpdate on key coll without empty result', async() => {
        const r = { value: { ok: 1, keyAltNames: ['other'] } } as any;
        sp.findOneAndUpdate.resolves(r);
        const result = await keyVault.removeKeyAlternateName(KEY_ID, 'altname');
        expect(sp.findOneAndUpdate).to.have.been.calledOnceWithExactly(
          DB,
          COLL,
          { _id: KEY_ID },
          { $pull: { 'keyAltNames': 'altname' }, $currentDate: { 'updateDate': true } },
          { returnOriginal: true }
        );
        expect(result).to.deep.equal({ ok: 1, keyAltNames: ['other'] });
      });
      it('calls findOneAndUpdate on key coll with empty result', async() => {
        const r = { value: { ok: 1, keyAltNames: ['altname'] } } as any;
        const r2 = { value: { ok: 2 } } as any;
        sp.findOneAndUpdate.onFirstCall().resolves(r);
        sp.findOneAndUpdate.onSecondCall().resolves(r2);
        const result = await keyVault.removeKeyAlternateName(KEY_ID, 'altname');
        const calls = sp.findOneAndUpdate.getCalls();
        expect(calls.length).to.equal(2);
        expect(calls[0].args).to.deep.equal([
          DB,
          COLL,
          { _id: KEY_ID },
          { $pull: { 'keyAltNames': 'altname' }, $currentDate: { 'updateDate': true } },
          { returnOriginal: true }
        ]);
        expect(calls[1].args).to.deep.equal([
          DB,
          COLL,
          { _id: KEY_ID, keyAltNames: undefined },
          { $unset: { 'keyAltNames': '' }, $currentDate: { 'updateDate': true } },
          { returnOriginal: true }
        ]);
        expect(result).to.deep.equal(r2.value);
      });
    });
  });
  describe('Mongo constructor FLE options', () => {
    before(() => {
      libmongoc = stubInterface<FLEClientEncryption>();
      sp = stubInterface<ServiceProvider>();
      sp.bsonLibrary = bson;
      sp.fle = { ClientEncryption: function() { return libmongoc; } } as any;
      sp.initialDb = 'test';
      internalState = new ShellInternalState(sp, stubInterface<EventEmitter>());
      internalState.currentDb = stubInterface<Database>();
    });
    it('accepts the same local key twice', () => {
      const localKmsOptions: ClientSideFieldLevelEncryptionOptions = {
        keyVaultNamespace: `${DB}.${COLL}`,
        kmsProviders: {
          local: {
            key: new bson.Binary(Buffer.alloc(96).toString('base64'))
          }
        },
        schemaMap: SCHEMA_MAP,
        bypassAutoEncryption: true
      };
      // eslint-disable-next-line no-new
      new Mongo(internalState, 'localhost:27017', localKmsOptions, undefined, sp);
      // eslint-disable-next-line no-new
      new Mongo(internalState, 'localhost:27017', localKmsOptions, undefined, sp);
    });
    it('fails if both explicitEncryptionOnly and schemaMap are passed', () => {
      const localKmsOptions: ClientSideFieldLevelEncryptionOptions = {
        keyVaultNamespace: `${DB}.${COLL}`,
        kmsProviders: {
          local: {
            key: new bson.Binary(Buffer.alloc(96).toString('base64'))
          }
        },
        schemaMap: SCHEMA_MAP,
        explicitEncryptionOnly: true
      };
      try {
        void new Mongo(internalState, 'localhost:27017', localKmsOptions, undefined, sp);
      } catch (e) {
        return expect(e.message).to.contain('explicitEncryptionOnly and schemaMap are mutually exclusive');
      }
      expect.fail('Expected error');
    });
  });
  describe('KeyVault constructor', () => {
    beforeEach(() => {
      libmongoc = stubInterface<FLEClientEncryption>();
      sp = stubInterface<ServiceProvider>();
      sp.getRawClient.returns(RAW_CLIENT);
      sp.bsonLibrary = bson;
      sp.fle = {
        ClientEncryption: function() {
          return libmongoc;
        }
      } as any;
      sp.initialDb = 'test';
      internalState = new ShellInternalState(sp, stubInterface<EventEmitter>());
      internalState.currentDb = stubInterface<Database>();
    });
    it('fails to construct when FLE options are missing on Mongo', () => {
      mongo = new Mongo(internalState, 'localhost:27017', undefined, undefined, sp);
      clientEncryption = new ClientEncryption(mongo);
      try {
        void new KeyVault(clientEncryption);
      } catch (e) {
        return expect(e.message).to.contain('FLE options must be passed to the Mongo object');
      }
      expect.fail('Expected error');
    });
  });

  describe('integration', () => {
    const testServer = startTestServer('shared');
    let dbname: string;
    let uri: string;
    let serviceProvider;
    let internalState;
    let connections: any[];

    beforeEach(async() => {
      dbname = `test_fle_${Date.now()}`;
      uri = `${await testServer.connectionString()}/${dbname}`;
      serviceProvider = await CliServiceProvider.connect(uri);
      internalState = new ShellInternalState(serviceProvider);

      connections = [];
      sinon.replace(require('tls'), 'connect', sinon.fake((options, onConnect) => {
        if (!fakeAWSHandlers.some(handler => handler.host.test(options.host))) {
          throw new Error(`Unexpected TLS connection to ${options.host}`);
        }
        process.nextTick(onConnect);
        const conn = makeFakeHTTPConnection(fakeAWSHandlers);
        connections.push(conn);
        return conn;
      }));
    });

    afterEach(async() => {
      await serviceProvider.dropDatabase(dbname);
      await internalState.close(true);
      sinon.restore();
    });

    const kms: [keyof KMSProvider, KMSProvider[keyof KMSProvider]][] = [
      ['local', {
        key: new bson.Binary(Buffer.from('kh4Gv2N8qopZQMQYMEtww/AkPsIrXNmEMxTrs3tUoTQZbZu4msdRUaR8U5fXD7A7QXYHcEvuu4WctJLoT+NvvV3eeIg3MD+K8H9SR794m/safgRHdIfy6PD+rFpvmFbY', 'base64'), 0)
      }],
      ['aws', {
        accessKeyId: 'SxHpYMUtB1CEVg9tX0N1',
        secretAccessKey: '44mjXTk34uMUmORma3w1viIAx4RCUv78bzwDY0R7'
      }],
      ['aws', {
        accessKeyId: 'SxHpYMUtB1CEVg9tX0N1',
        secretAccessKey: '44mjXTk34uMUmORma3w1viIAx4RCUv78bzwDY0R7',
        sessionToken: 'WXWHMnniSqij0CH27KK7H'
      } as any], // As any until we have NODE-3107
      ['azure', {
        tenantId: 'MUtB1CEVg9tX0',
        clientId: 'SxHpYMUtB1CEVg9tX0N1',
        clientSecret: '44mjXTk34uMUmORma3w1viIAx4RCUv78bzwDY0R7'
      }],
      ['gcp', {
        email: 'somebody@google.com',
        // Taken from the PKCS 8 Wikipedia page.
        privateKey: `\
MIIBVgIBADANBgkqhkiG9w0BAQEFAASCAUAwggE8AgEAAkEAq7BFUpkGp3+LQmlQ
Yx2eqzDV+xeG8kx/sQFV18S5JhzGeIJNA72wSeukEPojtqUyX2J0CciPBh7eqclQ
2zpAswIDAQABAkAgisq4+zRdrzkwH1ITV1vpytnkO/NiHcnePQiOW0VUybPyHoGM
/jf75C5xET7ZQpBe5kx5VHsPZj0CBb3b+wSRAiEA2mPWCBytosIU/ODRfq6EiV04
lt6waE7I2uSPqIC20LcCIQDJQYIHQII+3YaPqyhGgqMexuuuGx+lDKD6/Fu/JwPb
5QIhAKthiYcYKlL9h8bjDsQhZDUACPasjzdsDEdq8inDyLOFAiEAmCr/tZwA3qeA
ZoBzI10DGPIuoKXBd3nk/eBxPkaxlEECIQCNymjsoI7GldtujVnr1qT+3yedLfHK
srDVjIT3LsvTqw==`
      }]
    ];
    for (const [ kmsName, kmsOptions ] of kms) {
      // eslint-disable-next-line no-loop-func
      it(`provides ClientEncryption for kms=${kmsName}`, async() => {
        const mongo = new Mongo(internalState, uri, {
          keyVaultNamespace: `${dbname}.__keyVault`,
          kmsProviders: { [kmsName]: kmsOptions } as any,
          explicitEncryptionOnly: true
        }, serviceProvider);
        await mongo.connect();
        internalState.mongos.push(mongo);

        const keyVault = mongo.getKeyVault();
        let keyId;
        switch (kmsName) {
          case 'local':
            keyId = await keyVault.createKey('local');
            break;
          case 'aws':
            keyId = await keyVault.createKey('aws', {
              region: 'us-east-2',
              key: 'arn:aws:kms:us-east-2:398471984214:key/174b7c1d-3651-4517-7521-21988befd8cb'
            });
            break;
          case 'azure':
            keyId = await keyVault.createKey('azure', {
              keyName: 'asdfghji',
              keyVaultEndpoint: 'test.vault.azure.net'
            });
            break;
          case 'gcp':
            keyId = await keyVault.createKey('gcp', {
              projectId: 'foo',
              location: 'global',
              keyRing: 'bar',
              keyName: 'foobar'
            });
            break;
          default:
            throw new Error(`unreachable ${kmsName}`);
        }

        const plaintextValue = { someValue: 'foo' };

        const clientEncryption = mongo.getClientEncryption();
        const encrypted = await clientEncryption.encrypt(
          keyId,
          plaintextValue,
          'AEAD_AES_256_CBC_HMAC_SHA_512-Random');
        const decrypted = await clientEncryption.decrypt(encrypted);

        expect(keyId.sub_type).to.equal(4); // UUID
        expect(encrypted.sub_type).to.equal(6); // Encrypted
        expect(decrypted).to.deep.equal(plaintextValue);

        if ((kmsOptions as any).sessionToken) { // as any -> NODE-3107
          expect(
            connections.map(
              conn => conn.requests.map(
                req => req.headers['x-amz-security-token'])).flat())
            .to.include((kmsOptions as any).sessionToken);
        }
      });
    }
  });
});

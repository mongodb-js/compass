/* eslint-disable new-cap */
import { expect } from 'chai';
import ShellApi from './shell-api';
import { signatures, toShellResult } from './index';
import Cursor from './cursor';
import { nonAsyncFunctionsReturningPromises } from './decorators';
import { ALL_PLATFORMS, ALL_SERVER_VERSIONS, ALL_TOPOLOGIES } from './enums';
import sinon, { StubbedInstance, stubInterface } from 'ts-sinon';
import Mongo from './mongo';
import { ReplPlatform, ServiceProvider, bson, MongoClient } from '@mongosh/service-provider-core';
import { EventEmitter } from 'events';
import ShellInternalState, { EvaluationListener } from './shell-internal-state';

const b641234 = 'MTIzNA==';
const schemaMap = {
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

describe('ShellApi', () => {
  describe('signatures', () => {
    it('type', () => {
      expect(signatures.ShellApi.type).to.equal('ShellApi');
    });
    it('attributes', () => {
      expect(signatures.ShellApi.attributes.use).to.deep.equal({
        type: 'function',
        returnsPromise: false,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.show).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.exit).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: [ ReplPlatform.CLI ],
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.it).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.print).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.printjson).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.sleep).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.cls).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: { type: 'unknown', attributes: {} },
        platforms: ALL_PLATFORMS,
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.Mongo).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: 'Mongo',
        platforms: [ ReplPlatform.CLI ],
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
      expect(signatures.ShellApi.attributes.connect).to.deep.equal({
        type: 'function',
        returnsPromise: true,
        deprecated: false,
        returnType: 'Database',
        platforms: [ ReplPlatform.CLI ],
        topologies: ALL_TOPOLOGIES,
        serverVersions: ALL_SERVER_VERSIONS
      });
    });
  });
  describe('help', () => {
    const apiClass = new ShellApi({} as any);
    it('calls help function', async() => {
      expect((await toShellResult(apiClass.help())).type).to.equal('Help');
      expect((await toShellResult(apiClass.help)).type).to.equal('Help');
    });
  });
  describe('commands', () => {
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let newSP: StubbedInstance<ServiceProvider>;
    let rawClientStub: StubbedInstance<MongoClient>;
    let bus: EventEmitter;
    let internalState: ShellInternalState;
    let mongo: Mongo;

    beforeEach(() => {
      bus = new EventEmitter();
      rawClientStub = stubInterface<MongoClient>();
      newSP = stubInterface<ServiceProvider>();
      newSP.initialDb = 'test';
      newSP.bsonLibrary = bson;
      serviceProvider = stubInterface<ServiceProvider>();
      serviceProvider.getNewConnection.resolves(newSP);
      serviceProvider.initialDb = 'test';
      serviceProvider.bsonLibrary = bson;
      serviceProvider.getRawClient.returns(rawClientStub);
      mongo = stubInterface<Mongo>();
      mongo._serviceProvider = serviceProvider;
      internalState = new ShellInternalState(serviceProvider, bus);
      internalState.currentDb._mongo = mongo;
      serviceProvider.platform = ReplPlatform.CLI;
    });
    describe('use', () => {
      beforeEach(() => {
        internalState.shellApi.use('testdb');
      });
      it('calls use with arg', async() => {
        expect(mongo.use).to.have.been.calledWith('testdb');
      });
    });
    describe('show', () => {
      beforeEach(() => {
        internalState.shellApi.show('databases');
      });
      it('calls show with arg', async() => {
        expect(mongo.show).to.have.been.calledWith('databases');
      });
    });
    describe('it', () => {
      it('returns empty result if no current cursor', async() => {
        internalState.currentCursor = null;
        const res: any = await internalState.shellApi.it();
        expect((await toShellResult(res)).type).to.deep.equal('CursorIterationResult');
      });
      it('calls _it on current Cursor', async() => {
        internalState.currentCursor = stubInterface<Cursor>();
        await internalState.shellApi.it();
        expect(internalState.currentCursor._it).to.have.been.called;
      });
    });
    describe('Mongo', () => {
      beforeEach(() => {
        serviceProvider.platform = ReplPlatform.CLI;
      });
      it('returns a new Mongo object', async() => {
        const m = await internalState.shellApi.Mongo('localhost:27017');
        expect((await toShellResult(m)).type).to.equal('Mongo');
        expect(m._uri).to.equal('mongodb://localhost:27017/test?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      it('fails for non-CLI', async() => {
        serviceProvider.platform = ReplPlatform.Browser;
        try {
          await internalState.shellApi.Mongo('uri');
        } catch (e) {
          return expect(e.name).to.equal('MongoshUnimplementedError');
        }
        expect.fail('MongoshInvalidInputError not thrown for Mongo');
      });
      it('parses URI with mongodb://', async() => {
        const m = await internalState.shellApi.Mongo('mongodb://127.0.0.1:27017');
        expect(m._uri).to.equal('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      it('parses URI with just db', async() => {
        const m = await internalState.shellApi.Mongo('dbname');
        expect(m._uri).to.equal('mongodb://127.0.0.1:27017/dbname?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      context('FLE', () => {
        [
          { type: 'base64 string', key: b641234, expectedKey: b641234 },
          { type: 'Buffer', key: Buffer.from(b641234, 'base64'), expectedKey: Buffer.from(b641234, 'base64') },
          { type: 'BinData', key: new bson.Binary(Buffer.from(b641234, 'base64'), 128), expectedKey: Buffer.from(b641234, 'base64') }
        ].forEach(({ type, key, expectedKey }) => {
          it(`local kms provider - key is ${type}`, async() => {
            await internalState.shellApi.Mongo('dbname', {
              keyVaultNamespace: 'encryption.dataKeys',
              kmsProviders: {
                local: {
                  key: key
                }
              }
            });
            expect(serviceProvider.getNewConnection).to.have.been.calledOnceWithExactly(
              'mongodb://127.0.0.1:27017/dbname?directConnection=true&serverSelectionTimeoutMS=2000',
              {
                autoEncryption: {
                  extraOptions: {},
                  keyVaultClient: undefined,
                  keyVaultNamespace: 'encryption.dataKeys',
                  kmsProviders: { local: { key: expectedKey } }
                }
              });
          });
        });
        it('aws kms provider', async() => {
          await internalState.shellApi.Mongo('dbname', {
            keyVaultNamespace: 'encryption.dataKeys',
            kmsProviders: {
              aws: {
                accessKeyId: 'abc',
                secretAccessKey: '123'
              }
            }
          });
          expect(serviceProvider.getNewConnection).to.have.been.calledOnceWithExactly(
            'mongodb://127.0.0.1:27017/dbname?directConnection=true&serverSelectionTimeoutMS=2000',
            {
              autoEncryption: {
                extraOptions: {},
                keyVaultClient: undefined,
                keyVaultNamespace: 'encryption.dataKeys',
                kmsProviders: { aws: { accessKeyId: 'abc', secretAccessKey: '123' } }
              }
            });
        });
        it('local kms provider with current as Mongo', async() => {
          await internalState.shellApi.Mongo('dbname', {
            keyVaultNamespace: 'encryption.dataKeys',
            kmsProviders: {
              local: {
                key: Buffer.from(b641234, 'base64')
              }
            },
            keyVaultClient: mongo
          });
          expect(serviceProvider.getNewConnection).to.have.been.calledOnceWithExactly(
            'mongodb://127.0.0.1:27017/dbname?directConnection=true&serverSelectionTimeoutMS=2000',
            {
              autoEncryption: {
                extraOptions: {},
                keyVaultClient: rawClientStub,
                keyVaultNamespace: 'encryption.dataKeys',
                kmsProviders: { local: { key: Buffer.from(b641234, 'base64') } }
              }
            });
        });
        it('local kms provider with different Mongo', async() => {
          const sp = stubInterface<ServiceProvider>();
          const rc = stubInterface<MongoClient>();
          sp.getRawClient.returns(rc);
          const m = new Mongo({ initialServiceProvider: sp } as any, 'dbName', undefined, undefined, sp);
          await internalState.shellApi.Mongo('dbname', {
            keyVaultNamespace: 'encryption.dataKeys',
            kmsProviders: {
              local: {
                key: Buffer.from(b641234, 'base64')
              }
            },
            keyVaultClient: m
          });
          expect(serviceProvider.getNewConnection).to.have.been.calledOnceWithExactly(
            'mongodb://127.0.0.1:27017/dbname?directConnection=true&serverSelectionTimeoutMS=2000',
            {
              autoEncryption: {
                extraOptions: {},
                keyVaultClient: rc,
                keyVaultNamespace: 'encryption.dataKeys',
                kmsProviders: { local: { key: Buffer.from(b641234, 'base64') } }
              }
            });
        });
        it('throws if missing namespace', async() => {
          try {
            await internalState.shellApi.Mongo('dbname', {
              kmsProviders: {
                aws: {
                  accessKeyId: 'abc',
                  secretAccessKey: '123'
                }
              }
            } as any);
          } catch (e) {
            return expect(e.message).to.contain('required property');
          }
          expect.fail('failed to throw expected error');
        });
        it('throws if missing kmsProviders', async() => {
          try {
            await internalState.shellApi.Mongo('dbname', {
              keyVaultNamespace: 'encryption.dataKeys'
            } as any);
          } catch (e) {
            return expect(e.message).to.contain('required property');
          }
          expect.fail('failed to throw expected error');
        });
        it('throws for unknown args', async() => {
          try {
            await internalState.shellApi.Mongo('dbname', {
              keyVaultNamespace: 'encryption.dataKeys',
              kmsProviders: {
                aws: {
                  accessKeyId: 'abc',
                  secretAccessKey: '123'
                }
              },
              unknownKey: 1
            } as any);
          } catch (e) {
            return expect(e.message).to.contain('unknownKey');
          }
          expect.fail('failed to throw expected error');
        });
        it('passes along optional arguments', async() => {
          await internalState.shellApi.Mongo('dbname', {
            keyVaultNamespace: 'encryption.dataKeys',
            kmsProviders: {
              local: {
                key: Buffer.from(b641234, 'base64')
              }
            },
            schemaMap: schemaMap,
            bypassAutoEncryption: true
          });
          expect(serviceProvider.getNewConnection).to.have.been.calledOnceWithExactly(
            'mongodb://127.0.0.1:27017/dbname?directConnection=true&serverSelectionTimeoutMS=2000',
            {
              autoEncryption: {
                extraOptions: {},
                keyVaultClient: undefined,
                keyVaultNamespace: 'encryption.dataKeys',
                kmsProviders: { local: { key: Buffer.from(b641234, 'base64') } },
                schemaMap: schemaMap,
                bypassAutoEncryption: true
              }
            });
        });
      });
    });
    describe('connect', () => {
      it('returns a new DB', async() => {
        serviceProvider.platform = ReplPlatform.CLI;
        const db = await internalState.shellApi.connect('localhost:27017', 'username', 'pwd');
        expect((await toShellResult(db)).type).to.equal('Database');
        expect(db.getMongo()._uri).to.equal('mongodb://localhost:27017/test?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      it('fails with no arg', async() => {
        serviceProvider.platform = ReplPlatform.CLI;
        try {
          await (internalState.shellApi as any).connect();
        } catch (e) {
          return expect(e.name).to.equal('MongoshInvalidInputError');
        }
        expect.fail('MongoshInvalidInputError not thrown for connect');
      });
    });
    describe('version', () => {
      it('returns a string for the version', () => {
        const version = internalState.shellApi.version();
        const expected = require('../package.json').version;
        expect(version).to.be.a('string');
        expect(version).to.equal(expected);
      });
    });
  });
  describe('from context', () => {
    let serviceProvider: StubbedInstance<ServiceProvider>;
    let bus: EventEmitter;
    let internalState: ShellInternalState;
    let mongo: Mongo;
    let evaluationListener: StubbedInstance<EvaluationListener>;

    beforeEach(() => {
      bus = new EventEmitter();
      const newSP = stubInterface<ServiceProvider>();
      newSP.initialDb = 'test';
      serviceProvider = stubInterface<ServiceProvider>({ getNewConnection: newSP });
      serviceProvider.initialDb = 'test';
      serviceProvider.platform = ReplPlatform.CLI;
      serviceProvider.bsonLibrary = bson;
      mongo = stubInterface<Mongo>();
      mongo._serviceProvider = serviceProvider;
      evaluationListener = stubInterface<EvaluationListener>();
      internalState = new ShellInternalState(serviceProvider, bus);
      internalState.setCtx({});
      internalState.mongos.push(mongo);
      internalState.currentDb._mongo = mongo;
      internalState.setEvaluationListener(evaluationListener);
    });
    it('calls help function', async() => {
      expect((await toShellResult(internalState.context.use.help())).type).to.equal('Help');
      expect((await toShellResult(internalState.context.use.help)).type).to.equal('Help');
    });
    describe('use', () => {
      beforeEach(() => {
        internalState.context.use('testdb');
      });
      it('calls use with arg', async() => {
        expect(mongo.use).to.have.been.calledWith('testdb');
      });
    });
    describe('show', () => {
      beforeEach(() => {
        internalState.context.show('databases');
      });
      it('calls show with arg', async() => {
        expect(mongo.show).to.have.been.calledWith('databases');
      });
    });
    describe('it', () => {
      it('returns empty result if no current cursor', async() => {
        internalState.currentCursor = null;
        const res: any = await internalState.context.it();
        expect((await toShellResult(res)).type).to.deep.equal('CursorIterationResult');
      });
      it('calls _it on current Cursor', async() => {
        internalState.currentCursor = stubInterface<Cursor>();
        await internalState.context.it();
        expect(internalState.currentCursor._it).to.have.been.called;
      });
    });
    describe('Mongo', () => {
      beforeEach(() => {
        serviceProvider.platform = ReplPlatform.CLI;
      });
      it('returns a new Mongo object', async() => {
        const m = await internalState.context.Mongo('mongodb://127.0.0.1:27017');
        expect((await toShellResult(m)).type).to.equal('Mongo');
        expect(m._uri).to.equal('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      it('fails for non-CLI', async() => {
        serviceProvider.platform = ReplPlatform.Browser;
        try {
          await internalState.shellApi.Mongo('mongodb://127.0.0.1:27017');
        } catch (e) {
          return expect(e.name).to.equal('MongoshUnimplementedError');
        }
        expect.fail('MongoshInvalidInputError not thrown for Mongo');
      });
    });
    describe('connect', () => {
      it('returns a new DB', async() => {
        serviceProvider.platform = ReplPlatform.CLI;
        const db = await internalState.context.connect('mongodb://127.0.0.1:27017');
        expect((await toShellResult(db)).type).to.equal('Database');
        expect(db.getMongo()._uri).to.equal('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
      });
      it('handles username/pwd', async() => {
        serviceProvider.platform = ReplPlatform.CLI;
        const db = await internalState.context.connect('mongodb://127.0.0.1:27017', 'username', 'pwd');
        expect((await toShellResult(db)).type).to.equal('Database');
        expect(db.getMongo()._uri).to.equal('mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000');
        expect(serviceProvider.getNewConnection).to.have.been.calledOnceWithExactly(
          'mongodb://127.0.0.1:27017/?directConnection=true&serverSelectionTimeoutMS=2000',
          { auth: { username: 'username', password: 'pwd' } });
      });
    });
    describe('version', () => {
      it('returns a string for the version', () => {
        const version = internalState.context.version();
        const expected = require('../package.json').version;
        expect(version).to.be.a('string');
        expect(version).to.equal(expected);
      });
    });
    describe('DBQuery', () => {
      it('throws for shellBatchSize', () => {
        try {
          internalState.context.DBQuery.shellBatchSize();
        } catch (e) {
          expect(e.message).to.contain('deprecated');
          expect(e.message).to.contain('find().batchSize');
          return;
        }
        expect.fail();
      });
      it('throws for asPrintable', async() => {
        expect((await toShellResult(internalState.context.DBQuery)).printable).to.contain('deprecated');
      });
    });
    for (const cmd of ['exit', 'quit']) {
      // eslint-disable-next-line no-loop-func
      describe(cmd, () => {
        it('instructs the shell to exit', async() => {
          evaluationListener.onExit.resolves();
          try {
            await internalState.context[cmd]();
            expect.fail('missed exception');
          } catch (e) {
            // We should be getting an exception because we’re not actually exiting.
            expect(e.message).to.contain('onExit listener returned');
          }
          expect(evaluationListener.onExit).to.have.been.calledWith();
        });
      });
    }
    describe('enableTelemetry', () => {
      it('calls .setConfig("enableTelemetry") with true', () => {
        internalState.context.enableTelemetry();
        expect(evaluationListener.setConfig).to.have.been.calledWith('enableTelemetry', true);
      });
    });
    describe('disableTelemetry', () => {
      it('calls .setConfig("enableTelemetry") with false', () => {
        internalState.context.disableTelemetry();
        expect(evaluationListener.setConfig).to.have.been.calledWith('enableTelemetry', false);
      });
    });
    describe('passwordPrompt', () => {
      it('asks the evaluation listener for a password', async() => {
        evaluationListener.onPrompt.resolves('passw0rd');
        const pwd = await internalState.context.passwordPrompt();
        expect(pwd).to.equal('passw0rd');
        expect(evaluationListener.onPrompt).to.have.been.calledWith('Enter password', 'password');
      });
      it('fails for currently unsupported platforms', async() => {
        internalState.setEvaluationListener({});
        try {
          await internalState.context.passwordPrompt();
          expect.fail('missed exception');
        } catch (err) {
          expect(err.message).to.equal('[COMMON-90002] passwordPrompt() is not available in this shell');
        }
      });
    });
    describe('sleep', () => {
      it('suspends execution', async() => {
        const now = Date.now();
        await internalState.context.sleep(50);
        const then = Date.now();
        expect(then - now).to.be.greaterThan(40);
      });
    });
    describe('cls', () => {
      it('clears the screen', async() => {
        evaluationListener.onClearCommand.resolves();
        await internalState.context.cls();
        expect(evaluationListener.onClearCommand).to.have.been.calledWith();
      });
    });
    describe('load', () => {
      it('asks the evaluation listener to load a file', async() => {
        const apiLoadFileListener = sinon.stub();
        bus.on('mongosh:api-load-file', apiLoadFileListener);
        evaluationListener.onLoad.callsFake(async(filename: string) => {
          expect(filename).to.equal('abc.js');
          expect(internalState.context.__filename).to.equal(undefined);
          expect(internalState.context.__dirname).to.equal(undefined);
          return {
            resolvedFilename: '/resolved/abc.js',
            evaluate: async() => {
              expect(internalState.context.__filename).to.equal('/resolved/abc.js');
              expect(internalState.context.__dirname).to.equal('/resolved');
            }
          };
        });
        await internalState.context.load('abc.js');
        expect(evaluationListener.onLoad).to.have.callCount(1);
        expect(internalState.context.__filename).to.equal(undefined);
        expect(internalState.context.__dirname).to.equal(undefined);
        expect(apiLoadFileListener).to.have.been.calledWith({ nested: false, filename: 'abc.js' });
      });
      it('emits different events depending on nesting level', async() => {
        const apiLoadFileListener = sinon.stub();
        bus.on('mongosh:api-load-file', apiLoadFileListener);
        evaluationListener.onLoad.callsFake(async(filename: string) => {
          return {
            resolvedFilename: '/resolved/' + filename,
            evaluate: async() => {
              if (filename === 'def.js') {
                return;
              }
              await internalState.context.load('def.js');
            }
          };
        });
        await internalState.context.load('abc.js');
        expect(apiLoadFileListener).to.have.callCount(2);
        expect(apiLoadFileListener).to.have.been.calledWith({ nested: false, filename: 'abc.js' });
        expect(apiLoadFileListener).to.have.been.calledWith({ nested: true, filename: 'def.js' });
      });
    });
    for (const cmd of ['print', 'printjson']) {
      // eslint-disable-next-line no-loop-func
      describe(cmd, () => {
        it('prints values', async() => {
          evaluationListener.onPrint.resolves();
          await internalState.context[cmd](1, 2);
          expect(evaluationListener.onPrint).to.have.been.calledWith([
            { printable: 1, rawValue: 1, type: null },
            { printable: 2, rawValue: 2, type: null }
          ]);
        });
      });
    }

    describe('config', () => {
      context('with a full-config evaluation listener', () => {
        let store;
        let config;

        beforeEach(() => {
          config = internalState.context.config;
          store = {};
          evaluationListener.setConfig.callsFake(async(key, value) => {
            if (key === 'unavailable' as any) return 'ignored';
            store[key] = value;
            return 'success';
          });
          evaluationListener.getConfig.callsFake(async key => store[key]);
          evaluationListener.listConfigOptions.callsFake(() => Object.keys(store));
        });

        it('can get/set/list config keys', async() => {
          const value = { structuredData: 'value' };
          expect(await config.set('somekey', value)).to.equal('Setting "somekey" has been changed');
          expect(await config.get('somekey')).to.deep.equal(value);
          expect((await toShellResult(config)).printable).to.deep.equal(
            new Map([['somekey', value]]));
        });

        it('will fall back to defaults', async() => {
          expect(await config.get('batchSize')).to.equal(20);
        });

        it('rejects setting unavailable config keys', async() => {
          expect(await config.set('unavailable', 'value')).to.equal('Option "unavailable" is not available in this environment');
        });
      });

      context('with a no-config evaluation listener', () => {
        let config;

        beforeEach(() => {
          config = internalState.context.config;
        });

        it('will work with defaults', async() => {
          expect(await config.get('batchSize')).to.equal(20);
          expect((await toShellResult(config)).printable).to.deep.equal(
            new Map([['batchSize', 20], ['enableTelemetry', false]] as any));
        });

        it('rejects setting all config keys', async() => {
          expect(await config.set('somekey', 'value')).to.equal('Option "somekey" is not available in this environment');
        });
      });
    });
  });
});

describe('returnsPromise marks async functions', () => {
  it('no non-async functions are marked returnsPromise', () => {
    expect(nonAsyncFunctionsReturningPromises).to.deep.equal([]);
  });
});

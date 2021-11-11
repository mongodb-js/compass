import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import { ConnectionOptions } from './connection-options';
import {
  extractPrivilegesByDatabaseAndCollection,
  getInstance,
  InstanceDetails,
} from './instance-detail-helper';

import * as fixtures from '../test/fixtures';
import { createMongoClientMock } from '../test/helpers';

const connectionOptions: ConnectionOptions = {
  connectionString: 'mongodb://localhost:27018/data-service',
};

describe('instance-detail-helper', function () {
  describe('#getInstance', function () {
    context('with local', function () {
      let mongoClient: MongoClient;

      before(async function () {
        mongoClient = await MongoClient.connect(
          connectionOptions.connectionString
        );
      });

      after(async function () {
        await mongoClient.close(true);
      });

      it('should not close the db after getting instance details', async function () {
        expect(
          await mongoClient.db('admin').command({ ping: 1 })
        ).to.have.property('ok', 1);
      });

      describe('instance details', function () {
        let instanceDetails: InstanceDetails;

        before(async function () {
          instanceDetails = await getInstance(mongoClient);
        });

        it('should have build info', function () {
          expect(instanceDetails).to.have.nested.property(
            'build.isEnterprise',
            false
          );

          expect(instanceDetails)
            .to.have.nested.property('build.version')
            .match(/^\d+?\.\d+?\.\d+?$/);
        });

        it('should have host info', function () {
          expect(instanceDetails).to.have.nested.property('host.arch');
          expect(instanceDetails).to.have.nested.property('host.cpu_cores');
          expect(instanceDetails).to.have.nested.property('host.cpu_frequency');
          expect(instanceDetails).to.have.nested.property('host.memory_bits');
          expect(instanceDetails).to.have.nested.property('host.os');
          expect(instanceDetails).to.have.nested.property('host.os_family');
          expect(instanceDetails).to.have.nested.property(
            'host.kernel_version'
          );
          expect(instanceDetails).to.have.nested.property(
            'host.kernel_version_string'
          );
        });

        it('should have is genuine mongodb info', function () {
          expect(instanceDetails).to.have.nested.property(
            'genuineMongoDB.isGenuine',
            true
          );
          expect(instanceDetails).to.have.nested.property(
            'genuineMongoDB.dbType',
            'mongodb'
          );
        });

        it('should have data lake info', function () {
          expect(instanceDetails).to.have.nested.property(
            'dataLake.isDataLake',
            false
          );
          expect(instanceDetails).to.have.nested.property(
            'dataLake.version',
            null
          );
        });
      });
    });

    context('with mocked client', function () {
      context('when errors returned from commands', function () {
        it('should throw if buildInfo was not available', async function () {
          const client = createMongoClientMock();

          try {
            await getInstance(client);
          } catch (e) {
            expect(e).to.be.instanceof(Error);
            return;
          }

          throw new Error("getInstance didn't throw");
        });

        it('should handle auth errors gracefully on any command except buildInfo', async function () {
          const client = createMongoClientMock({
            commands: {
              buildInfo: {},
            },
          });

          await getInstance(client);
        });

        it(`should throw if server returned an unexpected error on hostInfo command`, async function () {
          const randomError = new Error('Whoops');

          const client = createMongoClientMock({
            commands: {
              buildInfo: {},
              hostInfo: randomError,
            },
          });

          try {
            await getInstance(client);
          } catch (e) {
            expect(e).to.eq(randomError);
            return;
          }

          throw new Error("getInstance didn't throw");
        });

        it('should ignore all errors returned from getParameter command', async function () {
          const randomError = new Error('Whoops');

          const client = createMongoClientMock({
            commands: {
              buildInfo: {},
              getParameter: randomError,
            },
          });

          await getInstance(client);
        });
      });

      it('should parse build info', async function () {
        const client = createMongoClientMock({
          commands: {
            buildInfo: fixtures.BUILD_INFO_4_2,
          },
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'build.version',
          '4.2.17'
        );
        expect(instanceDetails).to.have.nested.property(
          'build.isEnterprise',
          true
        );
      });

      it('should detect data lake', async function () {
        const client = createMongoClientMock({
          commands: {
            buildInfo: fixtures.BUILD_INFO_DATA_LAKE,
          },
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'dataLake.isDataLake',
          true
        );
      });

      it('should detect if using genuine mongodb instance', async function () {
        const client = createMongoClientMock({
          commands: {
            buildInfo: fixtures.BUILD_INFO_4_2,
          },
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.isGenuine',
          true
        );
      });

      it('should detect cosmosdb', async function () {
        const client = createMongoClientMock({
          commands: {
            buildInfo: fixtures.COSMOSDB_BUILD_INFO,
            getCmdLineOpts: fixtures.CMD_LINE_OPTS,
          },
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.isGenuine',
          false
        );

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.dbType',
          'cosmosdb'
        );
      });

      it('should detect documentdb', async function () {
        const client = createMongoClientMock({
          commands: {
            buildInfo: {},
            getCmdLineOpts: fixtures.DOCUMENTDB_CMD_LINE_OPTS,
          },
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.isGenuine',
          false
        );

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.dbType',
          'documentdb'
        );
      });
    });
  });

  describe('#extractPrivilegesByDatabaseAndCollection', function () {
    it('returns a tree of databases and collections from privileges', function () {
      const dbs = extractPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: 'bar' }, actions: [] },
      ]);

      expect(dbs).to.have.nested.property('foo.bar').deep.eq([]);
    });

    it('keeps records for all collections in a database', function () {
      const dbs = extractPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: 'bar' }, actions: [] },
        { resource: { db: 'foo', collection: 'buz' }, actions: [] },
        { resource: { db: 'foo', collection: 'barbar' }, actions: [] },
      ]);
      expect(dbs).to.have.property('foo').have.keys(['bar', 'barbar', 'buz']);
    });

    it('returns database actions indicated by empty collection name', function () {
      const dbs = extractPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: '' }, actions: ['find'] },
      ]);
      expect(dbs.foo).to.have.property('').deep.eq(['find']);
    });

    it('returns multiple databases and collections and their actions', function () {
      const dbs = extractPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: 'bar' }, actions: ['find'] },
        { resource: { db: 'foo', collection: 'barbar' }, actions: ['find'] },
        { resource: { db: 'buz', collection: 'foo' }, actions: ['insert'] },
      ]);
      expect(dbs).to.deep.eq({
        foo: { bar: ['find'], barbar: ['find'] },
        buz: { foo: ['insert'] },
      });
    });
  });
});

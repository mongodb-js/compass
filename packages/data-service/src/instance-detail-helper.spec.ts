import { expect } from 'chai';
import _ from 'lodash';
import { Db, MongoClient } from 'mongodb';
import { ConnectionOptions } from './connection-options';
import { getInstance, InstanceDetails } from './instance-detail-helper';
import { Collection } from './run-command';

import * as fixtures from '../test/fixtures';

const connectionOptions: ConnectionOptions = {
  connectionString: 'mongodb://localhost:27018/data-service',
};

describe('instance-detail-helper', function () {
  context('with local', function () {
    let mongoClient: MongoClient;
    let db: Db;

    const dbName = 'data-service-instance-helper';
    const collName = 'test-instance-detail-helper-view';
    // TODO: When we switch to mongodb server 5 in our CI tests
    // const timeseriesCollName = 'TODO'
    const viewName = 'myView';

    before(async function () {
      mongoClient = await MongoClient.connect(
        connectionOptions.connectionString
      );

      db = mongoClient.db(dbName);

      await db.collection(collName).insertMany([
        {
          1: 'a',
          a: 1,
        },
        {
          2: 'a',
          a: 2,
        },
      ]);

      await db.createCollection(viewName, {
        viewOn: collName,
        pipeline: [{ $project: { a: 0 } }],
      });
    });

    after(async function () {
      await Promise.allSettled([
        db.collection(collName).drop(),
        db.collection(viewName).drop(),
      ]);
      await mongoClient.close(true);
    });

    it('should not close the db after getting instance details', async function () {
      await getInstance(mongoClient);
      expect(await db.admin().ping()).to.have.property('ok', 1);
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
        expect(instanceDetails).to.have.nested.property('host.kernel_version');
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

      describe('databases', function () {
        let dbInfo;
        let collInfo;
        let viewInfo;

        before(function () {
          dbInfo = _.find(instanceDetails.databases, ['_id', dbName]);
          collInfo = _.find(dbInfo.collections, ['name', collName]);
          viewInfo = _.find(dbInfo.collections, ['name', viewName]);
        });

        it('should have databases info', function () {
          expect(dbInfo).to.have.property('name', dbName);
          expect(dbInfo).to.have.property('document_count', 3);
          expect(dbInfo).to.have.property('storage_size');
          expect(dbInfo).to.have.property('index_count', 2);
          expect(dbInfo).to.have.property('index_size');
          expect(dbInfo).to.have.property('collections').to.have.lengthOf(3);
        });

        it('should have collections info for the database', function () {
          expect(collInfo).to.have.property('name', collName);
          expect(collInfo).to.have.property('database', dbName);
          expect(collInfo).to.have.property('type', 'collection');
          expect(collInfo).to.have.property('readonly', false);
          expect(collInfo).to.have.property('collation', null);
          expect(collInfo).to.have.property('view_on', null);
          expect(collInfo).to.have.property('pipeline', null);
        });

        it('should have the view info', function () {
          expect(viewInfo).to.have.property('name', viewName);
          expect(viewInfo).to.have.property('database', dbName);
          expect(viewInfo).to.have.property('type', 'view');
          expect(viewInfo).to.have.property('readonly', true);
          expect(viewInfo).to.have.property('collation', null);
          expect(viewInfo).to.have.property('view_on', collName);
          expect(viewInfo)
            .to.have.property('pipeline')
            .deep.eq([{ $project: { a: 0 } }]);
        });
      });
    });
  });

  context('with mocked client', function () {
    function createMongoClientMock(
      commands: Partial<{
        connectionStatus: unknown;
        getCmdLineOpts: unknown;
        hostInfo: unknown;
        buildInfo: unknown;
        listDatabases: unknown;
        getParameter: unknown;
        dbStats: unknown;
      }> = {},
      collections: ((db) => Collection[]) | Collection[] = []
    ): MongoClient {
      const db = {
        command(spec) {
          const cmd = Object.keys(spec).find((key) =>
            [
              'connectionStatus',
              'getCmdLineOpts',
              'hostInfo',
              'buildInfo',
              'listDatabases',
              'getParameter',
              'dbStats',
            ].includes(key)
          );

          if (cmd && commands[cmd]) {
            const command = commands[cmd];
            const result =
              typeof command === 'function' ? command(this) : command;
            if (result instanceof Error) {
              return Promise.reject(result);
            }
            return Promise.resolve({ ...result, ok: 1 });
          }

          return Promise.reject(
            new Error(
              `not authorized on ${String(
                this.databaseName
              )} to execute command ${JSON.stringify(spec)}`
            )
          );
        },
        listCollections() {
          // eslint-disable-next-line @typescript-eslint/no-this-alias
          const _db = this;
          return {
            toArray() {
              const result =
                typeof collections === 'function'
                  ? collections(_db)
                  : collections;
              if (result instanceof Error) {
                return Promise.reject(result);
              }
              return Promise.resolve(result);
            },
          };
        },
      };

      const client = {
        db(databaseName) {
          return { ...db, databaseName };
        },
      };

      return client as MongoClient;
    }

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

    it('should handle auth errors gracefully on any command', async function () {
      const client = createMongoClientMock({
        buildInfo: {},
      });

      await getInstance(client);
    });

    it('should throw if server returned an unexpected error on any command', async function () {
      const randomError = new Error('Whoops');

      const client = createMongoClientMock({
        connectionStatus: randomError,
        getCmdLineOpts: randomError,
        hostInfo: randomError,
        listDatabases: randomError,
        getParameter: randomError,
        dbStats: randomError,
        buildInfo: {},
      });

      try {
        await getInstance(client);
      } catch (e) {
        expect(e).to.eq(randomError);
        return;
      }

      throw new Error("getInstance didn't throw");
    });

    it('should parse build info', async function () {
      const client = createMongoClientMock({
        buildInfo: fixtures.BUILD_INFO_4_2,
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
        buildInfo: fixtures.BUILD_INFO_DATA_LAKE,
      });

      const instanceDetails = await getInstance(client);

      expect(instanceDetails).to.have.nested.property(
        'dataLake.isDataLake',
        true
      );
    });

    it('should detect if using genuine mongodb instance', async function () {
      const client = createMongoClientMock({
        buildInfo: fixtures.BUILD_INFO_4_2,
      });

      const instanceDetails = await getInstance(client);

      expect(instanceDetails).to.have.nested.property(
        'genuineMongoDB.isGenuine',
        true
      );
    });

    it('should detect cosmosdb', async function () {
      const client = createMongoClientMock({
        buildInfo: fixtures.COSMOSDB_BUILD_INFO,
        getCmdLineOpts: fixtures.CMD_LINE_OPTS,
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
        buildInfo: {},
        getCmdLineOpts: fixtures.DOCUMENTDB_CMD_LINE_OPTS,
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

    describe('for users with list databases / collections', function () {
      it('should return databases info', async function () {
        const client = createMongoClientMock({
          buildInfo: {},
          listDatabases: fixtures.LIST_DATABASES_NAME_ONLY,
          dbStats(db) {
            return fixtures.DB_STATS[db.databaseName] ?? {};
          },
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'databases[0].name',
          'sample_airbnb'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[0].document_count',
          5556
        );

        expect(instanceDetails).to.have.nested.property(
          'databases[1].name',
          'sample_geospatial'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[1].index_count',
          2
        );

        expect(instanceDetails).to.have.nested.property(
          'databases[2].name',
          'sample_mflix'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[2].storage_size',
          29491200
        );
      });

      it('should return collections info', async function () {
        const client = createMongoClientMock(
          {
            buildInfo: {},
            listDatabases: fixtures.LIST_DATABASES_NAME_ONLY,
            dbStats(db) {
              return fixtures.DB_STATS[db.databaseName] ?? {};
            },
          },
          (db) => fixtures.LIST_COLLECTIONS[db.databaseName]
        );

        const instanceDetails = await getInstance(client);

        expect(instanceDetails)
          .to.have.nested.property('databases[0].collections')
          .to.have.lengthOf(2);

        expect(instanceDetails)
          .to.have.nested.property('databases[1].collections')
          .to.have.lengthOf(1);

        expect(instanceDetails)
          .to.have.nested.property('databases[2].collections')
          .to.have.lengthOf(8);
      });
    });

    describe('for users with NO list databases / collections', function () {
      it('should get databases for which the user can list collections info from connection status privileges', async function () {
        const client = createMongoClientMock({
          buildInfo: {},
          connectionStatus: fixtures.CONNECTION_STATUS_USER_JOHN,
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'databases[0].name',
          'tenants'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[1].name',
          'reporting'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[2].name',
          'products'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[3].name',
          'sales'
        );
        expect(instanceDetails).to.have.nested.property(
          'databases[4].name',
          'accounts'
        );
      });

      it('should return empty list of databases when no database roles found', async function () {
        const client = createMongoClientMock({
          buildInfo: {},
          connectionStatus: fixtures.CONNECTION_STATUS_LISTDB_ONLY,
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails)
          .to.have.property('databases')
          .to.have.lengthOf(0);
      });

      it('should return no dabases / collections when no find riles exist for collections', async function () {
        const client = createMongoClientMock({
          buildInfo: {},
          connectionStatus: fixtures.CONNECTION_STATUS_FIND_NOT_ALLOWED,
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails)
          .to.have.property('databases')
          .to.have.lengthOf(0);
      });

      it('should return list of readable databases when required roles are present', async function () {
        const client = createMongoClientMock({
          buildInfo: {},
          connectionStatus: fixtures.CONNECTION_STATUS_COLL_ONLY,
        });

        const instanceDetails = await getInstance(client);

        expect(instanceDetails).to.have.nested.property(
          'databases[0].name',
          'db3'
        );
      });
    });

    describe('for users with both list databases collections and roles', function () {
      it('should deduplicate databases / collections in the list', async function () {
        const client = createMongoClientMock({
          buildInfo: {},
          connectionStatus: fixtures.CONNECTION_STATUS_SAMPLE_GEOSPATIAL,
          listDatabases: fixtures.LIST_DATABASES_NAME_ONLY,
          dbStats(db) {
            return fixtures.DB_STATS[db.databaseName] ?? {};
          },
        });

        const instanceDetails = await getInstance(client);
        const sampleGeospatial = instanceDetails.databases.filter(
          (db) => db.name === 'sample_geospatial'
        );

        expect(sampleGeospatial).to.have.lengthOf(1);
        expect(sampleGeospatial[0].collections).to.have.lengthOf(1);
      });
    });
  });
});

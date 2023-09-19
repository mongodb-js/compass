import { expect } from 'chai';
import { MongoClient } from 'mongodb';
import type { InstanceDetails } from './instance-detail-helper';
import {
  configuredKMSProviders,
  checkIsCSFLEConnection,
  getDatabasesByRoles,
  getPrivilegesByDatabaseAndCollection,
  getInstance,
} from './instance-detail-helper';

import * as fixtures from '../test/fixtures';
import { createMongoClientMock } from '../test/helpers';
import { mochaTestServer } from '@mongodb-js/compass-test-server';
import type { MongoCluster } from '@mongodb-js/compass-test-server';

describe('instance-detail-helper', function () {
  const cluster = mochaTestServer();

  describe('#getInstance', function () {
    context('with local', function () {
      let mongoCluster: MongoCluster;
      let mongoClient: MongoClient;

      before(async function () {
        mongoCluster = cluster();
        mongoClient = await MongoClient.connect(mongoCluster.connectionString);
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
        let instanceDetails: Omit<InstanceDetails, 'csfleMode'>;

        before(async function () {
          instanceDetails = await getInstance(
            mongoClient,
            mongoCluster.connectionString
          );
        });

        it('should have auth info', function () {
          expect(instanceDetails).to.have.nested.property('auth.user', null);
          expect(instanceDetails)
            .to.have.nested.property('auth.roles')
            .deep.eq([]);
          expect(instanceDetails)
            .to.have.nested.property('auth.privileges')
            .deep.eq([]);
        });

        it('should have build info', function () {
          expect(instanceDetails.build.isEnterprise).to.be.a('boolean');

          expect(instanceDetails)
            .to.have.nested.property('build.version')
            .match(/^\d+\.\d+\.\d+(-.+)?$/);
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

        it('should not be identified as atlas', function () {
          expect(instanceDetails).to.have.property('isAtlas', false);
        });
      });
    });

    context('with mocked client', function () {
      context('when errors returned from commands', function () {
        it('should throw if buildInfo was not available', async function () {
          const { client, connectionString } = createMongoClientMock();

          try {
            await getInstance(client, connectionString);
          } catch (e) {
            expect(e).to.be.instanceof(Error);
            return;
          }

          throw new Error("getInstance didn't throw");
        });

        it('should handle auth errors gracefully on any command except buildInfo', async function () {
          const { client, connectionString } = createMongoClientMock({
            commands: {
              buildInfo: {},
            },
          });

          await getInstance(client, connectionString);
        });

        it(`should throw if server returned an unexpected error on hostInfo command`, async function () {
          const randomError = new Error('Whoops');

          const { client, connectionString } = createMongoClientMock({
            commands: {
              buildInfo: {},
              hostInfo: randomError,
            },
          });

          try {
            await getInstance(client, connectionString);
          } catch (e) {
            expect(e).to.eq(randomError);
            return;
          }

          throw new Error("getInstance didn't throw");
        });

        it('should ignore all errors returned from getParameter command', async function () {
          const randomError = new Error('Whoops');

          const { client, connectionString } = createMongoClientMock({
            commands: {
              buildInfo: {},
              getParameter: randomError,
            },
          });

          await getInstance(client, connectionString);
        });
      });

      it('should parse build info', async function () {
        const { client, connectionString } = createMongoClientMock({
          commands: {
            buildInfo: fixtures.BUILD_INFO_4_2,
          },
        });

        const instanceDetails = await getInstance(client, connectionString);

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
        const { client, connectionString } = createMongoClientMock({
          commands: {
            buildInfo: fixtures.BUILD_INFO_DATA_LAKE,
          },
        });

        const instanceDetails = await getInstance(client, connectionString);

        expect(instanceDetails).to.have.nested.property(
          'dataLake.isDataLake',
          true
        );
      });

      it('should detect if using genuine mongodb instance', async function () {
        const { client, connectionString } = createMongoClientMock({
          commands: {
            buildInfo: fixtures.BUILD_INFO_4_2,
          },
        });

        const instanceDetails = await getInstance(client, connectionString);

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.isGenuine',
          true
        );
      });

      it('should detect cosmosdb', async function () {
        const { client, connectionString } = createMongoClientMock({
          hosts: [
            {
              host: 'compass-vcore.mongocluster.cosmos.azure.com',
              port: 27017,
            },
          ],
          // Note: buildInfo and cmdLineOpts are not required to detect fake
          // mongodb deployment Here we are simply stubbing the calls for these
          // commands
          commands: {
            buildInfo: {},
            getCmdLineOpts: fixtures.CMD_LINE_OPTS,
          },
        });

        const instanceDetails = await getInstance(client, connectionString);

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
        const { client, connectionString } = createMongoClientMock({
          hosts: [
            {
              host: 'elastic-docdb-123456789.eu-central-1.docdb-elastic.amazonaws.com',
              port: 27017,
            },
          ],
          // Note: buildInfo and cmdLineOpts are not required to detect fake
          // mongodb deployment Here we are simply stubbing the calls for these
          // commands
          commands: {
            buildInfo: {},
            getCmdLineOpts: fixtures.CMD_LINE_OPTS,
          },
        });

        const instanceDetails = await getInstance(client, connectionString);

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.isGenuine',
          false
        );

        expect(instanceDetails).to.have.nested.property(
          'genuineMongoDB.dbType',
          'documentdb'
        );
      });

      context('isAtlas and isLocalAtlas', function () {
        it(`should be identified as atlas with hostname correct hostnames`, function () {
          ['myserver.mongodb.net', 'myserver.mongodb-dev.net'].map(
            async (hostname) => {
              const { client, connectionString } = createMongoClientMock({
                hosts: [{ host: hostname, port: 9999 }],
                commands: {
                  buildInfo: {},
                  getCmdLineOpts: fixtures.CMD_LINE_OPTS,
                },
              });

              const instanceDetails = await getInstance(
                client,
                connectionString
              );

              expect(instanceDetails).to.have.property('isAtlas', true);
            }
          );
        });

        it(`should be identified as atlas when atlasVersion command is present`, async function () {
          const { client, connectionString } = createMongoClientMock({
            hosts: [{ host: 'fakehost.my.server.com', port: 9999 }],
            commands: {
              atlasVersion: { atlasVersion: '1.1.1', gitVersion: '1.2.3' },
              buildInfo: {},
              getCmdLineOpts: fixtures.CMD_LINE_OPTS,
            },
          });

          const instanceDetails = await getInstance(client, connectionString);

          expect(instanceDetails).to.have.property('isAtlas', true);
        });

        it(`should not be identified as atlas when atlasVersion command is missing`, async function () {
          const { client, connectionString } = createMongoClientMock({
            hosts: [{ host: 'fakehost.my.server.com', port: 9999 }],
            commands: {
              atlasVersion: new Error('command not found'),
              buildInfo: {},
              getCmdLineOpts: fixtures.CMD_LINE_OPTS,
            },
          });

          const instanceDetails = await getInstance(client, connectionString);

          expect(instanceDetails).to.have.property('isAtlas', false);
        });

        context(
          'when atlasCliLocalDevCluster is not stored in admin.atlascli',
          function () {
            it('should not detect local atlas', async function () {
              const { client, connectionString } = createMongoClientMock({
                commands: {
                  buildInfo: {},
                },
              });
              const instanceDetails = await getInstance(
                client,
                connectionString
              );
              expect(instanceDetails.isLocalAtlas).to.be.false;
              expect(instanceDetails.isAtlas).to.be.false;
            });

            it('should not detect local atlas when user is connected to cloud atlas', async function () {
              const { client, connectionString } = createMongoClientMock({
                hosts: [
                  {
                    host: 'analytics-node-test.e06dc.mongodb.net',
                    port: 17018,
                  },
                ],
                commands: {
                  buildInfo: {},
                },
              });
              const instanceDetails = await getInstance(
                client,
                connectionString
              );
              expect(instanceDetails.isLocalAtlas).to.be.false;
              expect(instanceDetails.isAtlas).to.be.true;
            });
          }
        );

        context(
          'when atlasCliLocalDevCluster is stored in admin.atlascli',
          function () {
            it('should detect local atlas', async function () {
              const { client, connectionString } = createMongoClientMock({
                commands: {
                  buildInfo: {},
                },
                hasAdminDotAtlasCliEntry: true,
              });
              const instanceDetails = await getInstance(
                client,
                connectionString
              );
              expect(instanceDetails.isLocalAtlas).to.be.true;
              expect(instanceDetails.isAtlas).to.be.false;
            });

            it('should not detect local atlas when user is connected to cloud atlas', async function () {
              const { client, connectionString } = createMongoClientMock({
                hosts: [
                  {
                    host: 'analytics-node-test.e06dc.mongodb.net',
                    port: 17018,
                  },
                ],
                commands: {
                  buildInfo: {},
                },
                hasAdminDotAtlasCliEntry: true,
              });
              const instanceDetails = await getInstance(
                client,
                connectionString
              );
              expect(instanceDetails.isLocalAtlas).to.be.false;
              expect(instanceDetails.isAtlas).to.be.true;
            });
          }
        );
      });
    });
  });

  describe('#getDatabasesByRoles', function () {
    it('returns a list of databases matching the roles', function () {
      const dbs = getDatabasesByRoles(
        [
          { db: 'not-test', role: 'write' },
          { db: 'test', role: 'read' },
          { db: 'pineapple', role: 'customRole123' },
          { db: 'pineapple', role: 'customRole12' },
          { db: 'theater', role: 'dbAdmin' },
        ],
        ['read', 'readWrite', 'dbAdmin', 'dbOwner']
      );

      expect(dbs).to.deep.eq(['test', 'theater']);
    });

    it('handles an empty list', function () {
      const dbs = getDatabasesByRoles();

      expect(dbs).to.deep.eq([]);
    });

    it('handles an empty list with roles', function () {
      const dbs = getDatabasesByRoles(
        [],
        ['read', 'readWrite', 'dbAdmin', 'dbOwner']
      );

      expect(dbs).to.deep.eq([]);
    });

    it('does not return a duplicate database entry', function () {
      const dbs = getDatabasesByRoles(
        [
          { db: 'test', role: 'read' },
          { db: 'pineapple', role: 'customRole123' },
          { db: 'pineapple', role: 'customRole12' },
          { db: 'theater', role: 'readWrite' },
          { db: 'theater', role: 'customRole1' },
          { db: 'test', role: 'readWrite' },
        ],
        ['read', 'readWrite', 'dbAdmin', 'dbOwner']
      );

      expect(dbs).to.deep.eq(['test', 'theater']);
    });
  });

  describe('#getPrivilegesByDatabaseAndCollection', function () {
    it('returns a tree of databases and collections from privileges', function () {
      const dbs = getPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: 'bar' }, actions: [] },
      ]);

      expect(dbs).to.have.nested.property('foo.bar').deep.eq([]);
    });

    context('with known resources', function () {
      it('ignores cluster privileges', function () {
        const dbs = getPrivilegesByDatabaseAndCollection([
          { resource: { db: 'foo', collection: 'bar' }, actions: [] },
          { resource: { db: 'buz', collection: 'bla' }, actions: [] },
          { resource: { cluster: true }, actions: [] },
        ]);

        expect(dbs).to.deep.eq({
          foo: {
            bar: [],
          },
          buz: {
            bla: [],
          },
        });
      });

      it('ignores anyResource privileges', function () {
        const dbs = getPrivilegesByDatabaseAndCollection([
          { resource: { db: 'foo', collection: 'bar' }, actions: [] },
          { resource: { db: 'buz', collection: 'bla' }, actions: [] },
          { resource: { anyResource: true }, actions: [] },
        ]);

        expect(dbs).to.deep.eq({
          foo: {
            bar: [],
          },
          buz: {
            bla: [],
          },
        });
      });
    });

    context('with unknown resources', function () {
      it("ignores everything that doesn't have database and collection in resource", function () {
        const dbs = getPrivilegesByDatabaseAndCollection([
          { resource: { db: 'foo', collection: 'bar' }, actions: [] },
          { resource: { db: 'buz', collection: 'bla' }, actions: [] },
          { resource: { this: true }, actions: [] },
          { resource: { is: true }, actions: [] },
          { resource: { not: true }, actions: [] },
          { resource: { valid: true }, actions: [] },
          { resource: { resource: true }, actions: [] },
        ] as any);

        expect(dbs).to.deep.eq({
          foo: {
            bar: [],
          },
          buz: {
            bla: [],
          },
        });
      });
    });

    it('keeps records for all collections in a database', function () {
      const dbs = getPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: 'bar' }, actions: [] },
        { resource: { db: 'foo', collection: 'buz' }, actions: [] },
        { resource: { db: 'foo', collection: 'barbar' }, actions: [] },
      ]);
      expect(dbs).to.have.property('foo').have.keys(['bar', 'barbar', 'buz']);
    });

    it('returns database actions indicated by empty collection name', function () {
      const dbs = getPrivilegesByDatabaseAndCollection([
        { resource: { db: 'foo', collection: '' }, actions: ['find'] },
      ]);
      expect(dbs.foo).to.have.property('').deep.eq(['find']);
    });

    it('returns multiple databases and collections and their actions', function () {
      const dbs = getPrivilegesByDatabaseAndCollection([
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

  describe('#checkIsCSFLEConnection', function () {
    it('returns whether a KMS provider was configured', function () {
      expect(checkIsCSFLEConnection({ options: {} })).to.equal(false);
      expect(
        checkIsCSFLEConnection({
          options: {
            autoEncryption: {
              keyVaultNamespace: 'asdf',
            },
          },
        })
      ).to.equal(false);
      expect(
        checkIsCSFLEConnection({
          options: {
            autoEncryption: {
              kmsProviders: {
                aws: {} as any,
                local: {} as any,
              },
            },
          },
        })
      ).to.equal(false);
      expect(
        checkIsCSFLEConnection({
          options: {
            autoEncryption: {
              kmsProviders: {
                aws: {} as any,
                local: { key: 'data' },
              },
            },
          },
        })
      ).to.equal(true);
    });
  });

  describe('#configuredKMSProviders', function () {
    it('returns which KMS providers were configured', function () {
      expect(configuredKMSProviders({})).to.deep.equal([]);
      expect(
        configuredKMSProviders({
          keyVaultNamespace: 'asdf',
        })
      ).to.deep.equal([]);
      expect(
        configuredKMSProviders({
          kmsProviders: {
            aws: {} as any,
            local: {} as any,
          },
        })
      ).to.deep.equal([]);
      expect(
        configuredKMSProviders({
          kmsProviders: {
            aws: {} as any,
            local: { key: 'data' },
          },
        })
      ).to.deep.equal(['local']);
      expect(
        configuredKMSProviders({
          kmsProviders: {
            aws: { accessKeyId: 'x', secretAccessKey: 'y' },
            local: { key: 'data' },
          },
        })
      ).to.deep.equal(['aws', 'local']);
    });
  });
});

'use strict';
const { expect } = require('chai');
const { MongoDBInstance } = require('../');
const {
  createSandboxFromDefaultPreferences,
} = require('compass-preferences-model');

describe('mongodb-instance-model', function () {
  let preferences;

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  it('should be in initial state when created', function () {
    const instance = new MongoDBInstance({ _id: 'abc', preferences });
    expect(instance).to.have.property('status', 'initial');
    expect(instance.build.toJSON()).to.be.an('object').that.is.empty;
    expect(instance.host.toJSON()).to.be.an('object').that.is.empty;
  });

  it('should answer shouldFetchDbAndCollStats based on preferences', async function () {
    const instance = new MongoDBInstance({ _id: 'abc', preferences });

    await preferences.savePreferences({ enableDbAndCollStats: true });
    expect(instance.shouldFetchDbAndCollStats()).to.equal(true);

    await preferences.savePreferences({ enableDbAndCollStats: false });
    expect(instance.shouldFetchDbAndCollStats()).to.equal(false);
  });

  context('with mocked dataService', function () {
    const dataService = {
      instance() {
        // eslint-disable-next-line mocha/no-setup-in-describe
        return Promise.resolve({
          build: { version: '1.2.3' },
          host: { arch: 'x64' },
          genuineMongoDB: { isGenuine: true },
          dataLake: { isDataLake: false },
        });
      },
    };

    it('should fetch and populate instance info when fetch called', async function () {
      const instance = new MongoDBInstance({ _id: 'abc', preferences });

      await instance.fetch({ dataService });

      expect(instance).to.have.nested.property('build.version', '1.2.3');
      expect(instance).to.have.nested.property('host.arch', 'x64');
      expect(instance).to.have.nested.property(
        'genuineMongoDB.isGenuine',
        true
      );
      expect(instance).to.have.nested.property('dataLake.isDataLake', false);
    });
  });

  context('with topologyDescription', function () {
    it('contains derived properties', function () {
      const getTopologyDescription = (override) => {
        return Object.assign(
          {
            type: 'Unknown',
            servers: [
              {
                address: 'foo.com:1234',
                type: 'Unknown',
                tags: ['foo', 'bar', 'baz'],
              },
            ],
            setName: 'bar',
          },
          override ?? {}
        );
      };

      const instance = new MongoDBInstance({
        _id: 'foo',
        hostname: 'foo.com',
        port: 1234,
        preferences,
        topologyDescription: getTopologyDescription(),
      });

      expect(instance).to.have.property('isWritable', false);
      expect(instance).to.have.property(
        'description',
        'Topology type: Unknown is not writable'
      );
      expect(instance).to.have.property('isTopologyWritable', false);
      expect(instance).to.have.property('isServerWritable', false);
      expect(instance).to.have.property('singleServerType', null);

      instance.set({
        topologyDescription: getTopologyDescription({
          type: 'ReplicaSetWithPrimary',
        }),
      });

      expect(instance).to.have.property('isWritable', true);
      expect(instance).to.have.property(
        'description',
        'Topology type: Replica Set (With Primary) is writable'
      );
      expect(instance).to.have.property('isTopologyWritable', true);
      expect(instance).to.have.property('isServerWritable', false);
      expect(instance).to.have.property('singleServerType', null);

      instance.set({
        topologyDescription: getTopologyDescription({
          type: 'Single',
        }),
      });

      expect(instance).to.have.property('isWritable', false);
      expect(instance).to.have.property(
        'description',
        'Single connection to server type: Unknown is not writable'
      );
      expect(instance).to.have.property('isTopologyWritable', true);
      expect(instance).to.have.property('isServerWritable', false);
      expect(instance).to.have.property('singleServerType', 'Unknown');

      instance.set({
        topologyDescription: getTopologyDescription({
          type: 'Single',
          servers: [
            {
              address: 'foo.com:1234',
              type: 'Standalone',
              tags: ['foo', 'bar', 'baz'],
            },
          ],
        }),
      });

      expect(instance).to.have.property('isWritable', true);
      expect(instance).to.have.property(
        'description',
        'Single connection to server type: Standalone is writable'
      );
      expect(instance).to.have.property('isTopologyWritable', true);
      expect(instance).to.have.property('isServerWritable', true);
      expect(instance).to.have.property('singleServerType', 'Standalone');
    });
  });
});

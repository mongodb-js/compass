const { expect } = require('chai');
const { MongoDBInstance, TopologyDescription } = require('../');

describe('mongodb-instance-model', function () {
  it('should be in initial state when created', function () {
    const instance = new MongoDBInstance({ _id: 'abc' });
    expect(instance).to.have.property('status', 'initial');
    expect(instance.build.toJSON()).to.be.an('object').that.is.empty;
    expect(instance.host.toJSON()).to.be.an('object').that.is.empty;
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
      const instance = new MongoDBInstance({ _id: 'abc' });

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
      const topologyDescription = {
        type: 'Unknown',
        servers: [{
          address: 'foo.com:1234',
          type: 'Unknown',
          tags: ['foo', 'bar', 'baz']
        }],
        setName: 'bar'
      };

      const instance = new MongoDBInstance({
        _id: 'foo',
        hostname: 'foo.com',
        port: 1234,
        topologyDescription: new TopologyDescription(topologyDescription)
      });

      expect(instance.isWritable).to.equal(false);
      expect(instance.description).to.equal('Topology type: Unknown is not writable');
      expect(instance.isTopologyWritable).to.equal(false);
      expect(instance.isServerWritable).to.equal(false);
      expect(instance.singleServerType).to.equal(null);

      topologyDescription.type = 'ReplicaSetWithPrimary';
      instance.set({ topologyDescription: new TopologyDescription(topologyDescription) })

      expect(instance.isWritable).to.equal(true);
      expect(instance.description).to.equal('Topology type: Replica Set (With Primary) is writable');
      expect(instance.isTopologyWritable).to.equal(true);
      expect(instance.isServerWritable).to.equal(false);
      expect(instance.singleServerType).to.equal(null);

      topologyDescription.type = 'Single';
      instance.set({ topologyDescription: new TopologyDescription(topologyDescription) })

      expect(instance.isWritable).to.equal(false);
      expect(instance.description).to.equal('Single connection to server type: Unknown is not writable');
      expect(instance.isTopologyWritable).to.equal(true);
      expect(instance.isServerWritable).to.equal(false);
      expect(instance.singleServerType).to.equal('Unknown');

      topologyDescription.servers[0].type = 'Standalone';
      instance.set({ topologyDescription: new TopologyDescription(topologyDescription) })

      expect(instance.isWritable).to.equal(true);
      expect(instance.description).to.equal('Single connection to server type: Standalone is writable');
      expect(instance.isTopologyWritable).to.equal(true);
      expect(instance.isServerWritable).to.equal(true);
      expect(instance.singleServerType).to.equal('Standalone');
    });
  });
});

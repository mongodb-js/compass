const expect = require('chai').expect;
const DeploymentStateStore = require('../../lib/stores/deployment-state-store');
const ServerType = require('../../lib/models/server-type');
const TopologyType = require('../../lib/models/topology-type');

describe('DeploymentStateStore', () => {
  beforeEach(() => {
    DeploymentStateStore.setState(DeploymentStateStore.getInitialState());
  });

  describe('#isWritable', () => {
    it('defaults to false', () => {
      expect(DeploymentStateStore.state.isWritable).to.equal(false);
    });

    it('defaults the description', () => {
      expect(DeploymentStateStore.state.description).to.equal('Topology type not yet discovered.');
    });

    context('when the topology changes to single', () => {
      context('when the server is a standalone', () => {
        it('returns true', (done) => {
          const unsubscribe = DeploymentStateStore.listen((state) => {
            expect(state.isWritable).to.equal(true);
            expect(DeploymentStateStore.state.isWritable).to.equal(true);
            unsubscribe();
            done();
          });
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.STANDALONE }]
          });
        });
      });

      context('when the server is a secondary', () => {
        it('returns false', () => {
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.RS_SECONDARY }]
          });
          expect(DeploymentStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is a primary', () => {
        it('returns true', (done) => {
          const unsubscribe = DeploymentStateStore.listen((state) => {
            expect(state.isWritable).to.equal(true);
            expect(DeploymentStateStore.state.isWritable).to.equal(true);
            unsubscribe();
            done();
          });
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.RS_PRIMARY }]
          });
        });
      });

      context('when the server is a mongos', () => {
        it('returns true', (done) => {
          const unsubscribe = DeploymentStateStore.listen((state) => {
            expect(state.isWritable).to.equal(true);
            expect(DeploymentStateStore.state.isWritable).to.equal(true);
            unsubscribe();
            done();
          });
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.MONGOS }]
          });
        });
      });

      context('when the server is an arbiter', () => {
        it('returns false', () => {
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.RS_ARBITER }]
          });
          expect(DeploymentStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is an other', () => {
        it('returns false', () => {
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.RS_OTHER }]
          });
          expect(DeploymentStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is a ghost', () => {
        it('returns false', () => {
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.RS_GHOST }]
          });
          expect(DeploymentStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is an unknown', () => {
        it('returns false', () => {
          DeploymentStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.UNKNOWN }]
          });
          expect(DeploymentStateStore.state.isWritable).to.equal(false);
        });
      });
    });

    context('when the topology changes to sharded', () => {
      it('returns true', (done) => {
        const unsubscribe = DeploymentStateStore.listen((state) => {
          expect(state.isWritable).to.equal(true);
          expect(DeploymentStateStore.state.isWritable).to.equal(true);
          unsubscribe();
          done();
        });
        DeploymentStateStore.topologyChanged({
          topologyType: TopologyType.SHARDED,
          servers: [{ type: ServerType.MONGOS }]
        });
      });
    });

    context('when the topology changes to replica set with primary', () => {
      it('returns true', (done) => {
        const unsubscribe = DeploymentStateStore.listen((state) => {
          expect(state.isWritable).to.equal(true);
          expect(DeploymentStateStore.state.isWritable).to.equal(true);
          unsubscribe();
          done();
        });
        DeploymentStateStore.topologyChanged({
          topologyType: TopologyType.REPLICA_SET_WITH_PRIMARY,
          servers: [{ type: ServerType.RS_PRIMARY }]
        });
      });
    });

    context('when the topology changes to replica set no primary', () => {
      it('returns false', () => {
        DeploymentStateStore.topologyChanged({
          topologyType: TopologyType.REPLICA_SET_NO_PRIMARY,
          servers: [{ type: ServerType.RS_SECONDARY }]
        });
        expect(DeploymentStateStore.state.isWritable).to.equal(false);
      });
    });

    context('when the topology changes to unknown', () => {
      it('returns false', () => {
        DeploymentStateStore.topologyChanged({
          topologyType: TopologyType.UNKNOWN,
          servers: [{ type: ServerType.UNKNOWN }]
        });
        expect(DeploymentStateStore.state.isWritable).to.equal(false);
      });
    });
  });
});

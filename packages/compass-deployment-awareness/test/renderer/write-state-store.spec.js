import WriteStateStore from 'stores/write-state-store';
import {
  SINGLE,
  SHARDED,
  REPLICA_SET_NO_PRIMARY,
  REPLICA_SET_WITH_PRIMARY,
  UNKNOWN
} from 'models/topology-type';
import {
  STANDALONE,
  RS_PRIMARY,
  RS_SECONDARY,
  RS_ARBITER,
  RS_OTHER,
  RS_GHOST,
  MONGOS,
  UNKNOWN as S_UNKNOWN
} from 'models/server-type';

describe('WriteStateStore', () => {
  beforeEach(() => {
    WriteStateStore.setState(WriteStateStore.getInitialState());
  });

  describe('#isWritable', () => {
    it('defaults to false', () => {
      expect(WriteStateStore.state.isWritable).to.equal(false);
    });

    it('defaults the description', () => {
      expect(WriteStateStore.state.description).to.equal('Topology type not yet discovered.');
    });

    context('when the topology changes to single', () => {
      context('when the server is a standalone', () => {
        it('returns true', (done) => {
          const unsubscribe = WriteStateStore.listen((state) => {
            expect(state.isWritable).to.equal(true);
            expect(WriteStateStore.state.isWritable).to.equal(true);
            unsubscribe();
            done();
          });
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: STANDALONE }]
          });
        });
      });

      context('when the server is a secondary', () => {
        it('returns false', () => {
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: RS_SECONDARY }]
          });
          expect(WriteStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is a primary', () => {
        it('returns true', (done) => {
          const unsubscribe = WriteStateStore.listen((state) => {
            expect(state.isWritable).to.equal(true);
            expect(WriteStateStore.state.isWritable).to.equal(true);
            unsubscribe();
            done();
          });
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: RS_PRIMARY }]
          });
        });
      });

      context('when the server is a mongos', () => {
        it('returns true', (done) => {
          const unsubscribe = WriteStateStore.listen((state) => {
            expect(state.isWritable).to.equal(true);
            expect(WriteStateStore.state.isWritable).to.equal(true);
            unsubscribe();
            done();
          });
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: MONGOS }]
          });
        });
      });

      context('when the server is an arbiter', () => {
        it('returns false', () => {
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: RS_ARBITER }]
          });
          expect(WriteStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is an other', () => {
        it('returns false', () => {
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: RS_OTHER }]
          });
          expect(WriteStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is a ghost', () => {
        it('returns false', () => {
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: RS_GHOST }]
          });
          expect(WriteStateStore.state.isWritable).to.equal(false);
        });
      });

      context('when the server is an unknown', () => {
        it('returns false', () => {
          WriteStateStore.topologyChanged({
            topologyType: SINGLE,
            servers: [{ type: S_UNKNOWN }]
          });
          expect(WriteStateStore.state.isWritable).to.equal(false);
        });
      });
    });

    context('when the topology changes to sharded', () => {
      it('returns true', (done) => {
        const unsubscribe = WriteStateStore.listen((state) => {
          expect(state.isWritable).to.equal(true);
          expect(WriteStateStore.state.isWritable).to.equal(true);
          unsubscribe();
          done();
        });
        WriteStateStore.topologyChanged({
          topologyType: SHARDED,
          servers: [{ type: MONGOS }]
        });
      });
    });

    context('when the topology changes to replica set with primary', () => {
      it('returns true', (done) => {
        const unsubscribe = WriteStateStore.listen((state) => {
          expect(state.isWritable).to.equal(true);
          expect(WriteStateStore.state.isWritable).to.equal(true);
          unsubscribe();
          done();
        });
        WriteStateStore.topologyChanged({
          topologyType: REPLICA_SET_WITH_PRIMARY,
          servers: [{ type: RS_PRIMARY }]
        });
      });
    });

    context('when the topology changes to replica set no primary', () => {
      it('returns false', () => {
        WriteStateStore.topologyChanged({
          topologyType: REPLICA_SET_NO_PRIMARY,
          servers: [{ type: RS_SECONDARY }]
        });
        expect(WriteStateStore.state.isWritable).to.equal(false);
      });
    });

    context('when the topology changes to unknown', () => {
      it('returns false', () => {
        WriteStateStore.topologyChanged({
          topologyType: UNKNOWN,
          servers: [{ type: S_UNKNOWN }]
        });
        expect(WriteStateStore.state.isWritable).to.equal(false);
      });
    });
  });
});

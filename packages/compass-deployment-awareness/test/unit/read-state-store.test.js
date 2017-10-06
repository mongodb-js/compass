const expect = require('chai').expect;
const { ReadPreference } = require('mongodb');
const { ReadStateStore, ServerType, TopologyType } = require('../../');

describe('ReadStateStore', () => {
  beforeEach(() => {
    ReadStateStore.setState(ReadStateStore.getInitialState());
  });

  describe('#isReadable', () => {
    beforeEach(() => {
      ReadStateStore.onConnectStoreChanged({
        currentConnection: { read_preference: ReadPreference.PRIMARY }
      });
    });

    it('defaults to false', () => {
      expect(ReadStateStore.state.isReadable).to.equal(false);
    });

    it('defaults the description', () => {
      expect(ReadStateStore.state.description).to.equal('Topology type not yet discovered.');
    });

    context('when the topology changes', () => {
      context('when the read state changes', () => {
        it('returns true', (done) => {
          const unsubscribe = ReadStateStore.listen((state) => {
            expect(state.isReadable).to.equal(true);
            expect(ReadStateStore.state.isReadable).to.equal(true);
            unsubscribe();
            done();
          });
          ReadStateStore.topologyChanged({
            topologyType: TopologyType.SINGLE,
            servers: [{ type: ServerType.STANDALONE }]
          });
        });
      });
    });
  });
});

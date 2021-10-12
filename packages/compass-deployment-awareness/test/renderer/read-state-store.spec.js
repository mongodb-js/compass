import { ReadPreference } from 'mongodb';
import ReadStateStore from '../../src/stores/read-state-store';
import { SINGLE } from '../../src/models/topology-type';
import { STANDALONE } from '../../src/models/server-type';

describe('ReadStateStore', () => {
  beforeEach(() => {
    ReadStateStore.setState(ReadStateStore.getInitialState());
  });

  describe('#isReadable', () => {
    beforeEach(() => {
      ReadStateStore.onDataServiceConnected(null, {
        getReadPreference: () => ReadPreference.PRIMARY
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
            topologyType: SINGLE,
            servers: [{ type: STANDALONE }]
          });
        });
      });
    });
  });
});

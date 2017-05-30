const expect = require('chai').expect;
const TopologyType = require('../../lib/models/topology-type');

describe('TopologyType', () => {
  describe('.isWritable', () => {
    context('when passed single', () => {
      it('returns true', () => {
        expect(TopologyType.isWritable(TopologyType.SINGLE)).to.equal(true);
      });
    });

    context('when passed replica set no primary', () => {
      it('returns false', () => {
        expect(TopologyType.isWritable(TopologyType.REPLICA_SET_NO_PRIMARY)).to.equal(false);
      });
    });

    context('when passed replica set with primary', () => {
      it('returns true', () => {
        expect(TopologyType.isWritable(TopologyType.REPLICA_SET_WITH_PRIMARY)).to.equal(true);
      });
    });

    context('when passed sharded', () => {
      it('returns true', () => {
        expect(TopologyType.isWritable(TopologyType.SHARDED)).to.equal(true);
      });
    });

    context('when passed unknown', () => {
      it('returns false', () => {
        expect(TopologyType.isWritable(TopologyType.UNKNOWN)).to.equal(false);
      });
    });
  });
});

const expect = require('chai').expect;
const { ReadPreference } = require('mongodb');
const TopologyType = require('../../lib/models/topology-type');

describe('TopologyType', () => {
  describe('.isReadable', () => {
    context('when the topology is single', () => {
      it('returns true', () => {
        expect(TopologyType.isReadable(TopologyType.SINGLE)).to.equal(true);
      });
    });

    context('when the topology is replica set no primary', () => {
      context('when the read preferece is primary', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_NO_PRIMARY,
          ReadPreference.PRIMARY
        );

        it('returns false', () => {
          expect(readable).to.equal(false);
        });
      });

      context('when the read preference is primary preferred', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_NO_PRIMARY,
          ReadPreference.PRIMARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_NO_PRIMARY,
          ReadPreference.SECONDARY
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary preferred', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_NO_PRIMARY,
          ReadPreference.SECONDARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is nearest', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_NO_PRIMARY,
          ReadPreference.NEAREST
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });
    });

    context('when the topology is replica set with primary', () => {
      context('when the read preferece is primary', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_WITH_PRIMARY,
          ReadPreference.PRIMARY
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is primary preferred', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_WITH_PRIMARY,
          ReadPreference.PRIMARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_WITH_PRIMARY,
          ReadPreference.SECONDARY
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary preferred', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_WITH_PRIMARY,
          ReadPreference.SECONDARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is nearest', () => {
        const readable = TopologyType.isReadable(
          TopologyType.REPLICA_SET_WITH_PRIMARY,
          ReadPreference.NEAREST
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });
    });

    context('when the topology is sharded', () => {
      it('returns true', () => {
        expect(TopologyType.isReadable(TopologyType.SHARDED)).to.equal(true);
      });
    });

    context('when the topology is unknown', () => {
      it('returns false', () => {
        expect(TopologyType.isReadable(TopologyType.UNKNOWN)).to.equal(false);
      });
    });
  });

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

import { ReadPreference } from 'mongodb';
import {
  isReadable,
  isWritable,
  REPLICA_SET_NO_PRIMARY,
  REPLICA_SET_WITH_PRIMARY,
  SHARDED,
  SINGLE,
  UNKNOWN
} from 'models/topology-type';

describe('TopologyType', () => {
  describe('.isReadable', () => {
    context('when the topology is single', () => {
      it('returns true', () => {
        expect(isReadable(SINGLE)).to.equal(true);
      });
    });

    context('when the topology is replica set no primary', () => {
      context('when the read preferece is primary', () => {
        const readable = isReadable(
          REPLICA_SET_NO_PRIMARY,
          ReadPreference.PRIMARY
        );

        it('returns false', () => {
          expect(readable).to.equal(false);
        });
      });

      context('when the read preference is primary preferred', () => {
        const readable = isReadable(
          REPLICA_SET_NO_PRIMARY,
          ReadPreference.PRIMARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary', () => {
        const readable = isReadable(
          REPLICA_SET_NO_PRIMARY,
          ReadPreference.SECONDARY
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary preferred', () => {
        const readable = isReadable(
          REPLICA_SET_NO_PRIMARY,
          ReadPreference.SECONDARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is nearest', () => {
        const readable = isReadable(
          REPLICA_SET_NO_PRIMARY,
          ReadPreference.NEAREST
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });
    });

    context('when the topology is replica set with primary', () => {
      context('when the read preferece is primary', () => {
        const readable = isReadable(
          REPLICA_SET_WITH_PRIMARY,
          ReadPreference.PRIMARY
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is primary preferred', () => {
        const readable = isReadable(
          REPLICA_SET_WITH_PRIMARY,
          ReadPreference.PRIMARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary', () => {
        const readable = isReadable(
          REPLICA_SET_WITH_PRIMARY,
          ReadPreference.SECONDARY
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is secondary preferred', () => {
        const readable = isReadable(
          REPLICA_SET_WITH_PRIMARY,
          ReadPreference.SECONDARY_PREFERRED
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });

      context('when the read preference is nearest', () => {
        const readable = isReadable(
          REPLICA_SET_WITH_PRIMARY,
          ReadPreference.NEAREST
        );

        it('returns true', () => {
          expect(readable).to.equal(true);
        });
      });
    });

    context('when the topology is sharded', () => {
      it('returns true', () => {
        expect(isReadable(SHARDED)).to.equal(true);
      });
    });

    context('when the topology is unknown', () => {
      it('returns false', () => {
        expect(isReadable(UNKNOWN)).to.equal(false);
      });
    });
  });

  describe('.isWritable', () => {
    context('when passed single', () => {
      it('returns true', () => {
        expect(isWritable(SINGLE)).to.equal(true);
      });
    });

    context('when passed replica set no primary', () => {
      it('returns false', () => {
        expect(isWritable(REPLICA_SET_NO_PRIMARY)).to.equal(false);
      });
    });

    context('when passed replica set with primary', () => {
      it('returns true', () => {
        expect(isWritable(REPLICA_SET_WITH_PRIMARY)).to.equal(true);
      });
    });

    context('when passed sharded', () => {
      it('returns true', () => {
        expect(isWritable(SHARDED)).to.equal(true);
      });
    });

    context('when passed unknown', () => {
      it('returns false', () => {
        expect(isWritable(UNKNOWN)).to.equal(false);
      });
    });
  });
});

import {
  isWritable,
  STANDALONE,
  MONGOS,
  POSSIBLE_PRIMARY,
  RS_PRIMARY,
  RS_SECONDARY,
  RS_ARBITER,
  RS_OTHER,
  RS_GHOST,
  UNKNOWN
} from './server-type';

describe('ServerType', () => {
  describe('.isWritable', () => {
    context('when passed standalone', () => {
      it('returns true', () => {
        expect(isWritable(STANDALONE)).to.equal(true);
      });
    });

    context('when passed mongos', () => {
      it('returns true', () => {
        expect(isWritable(MONGOS)).to.equal(true);
      });
    });

    context('when passed possible primary', () => {
      it('returns false', () => {
        expect(isWritable(POSSIBLE_PRIMARY)).to.equal(false);
      });
    });

    context('when passed primary', () => {
      it('returns true', () => {
        expect(isWritable(RS_PRIMARY)).to.equal(true);
      });
    });

    context('when passed secondary', () => {
      it('returns false', () => {
        expect(isWritable(RS_SECONDARY)).to.equal(false);
      });
    });

    context('when passed arbiter', () => {
      it('returns false', () => {
        expect(isWritable(RS_ARBITER)).to.equal(false);
      });
    });

    context('when passed other', () => {
      it('returns false', () => {
        expect(isWritable(RS_OTHER)).to.equal(false);
      });
    });

    context('when passed ghost', () => {
      it('returns false', () => {
        expect(isWritable(RS_GHOST)).to.equal(false);
      });
    });

    context('when passed unknown', () => {
      it('returns false', () => {
        expect(isWritable(UNKNOWN)).to.equal(false);
      });
    });
  });
});

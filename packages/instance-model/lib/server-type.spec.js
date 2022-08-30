import { expect } from 'chai';
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

describe('ServerType', function () {
  describe('.isWritable', function () {
    context('when passed standalone', function () {
      it('returns true', function () {
        expect(isWritable(STANDALONE)).to.equal(true);
      });
    });

    context('when passed mongos', function () {
      it('returns true', function () {
        expect(isWritable(MONGOS)).to.equal(true);
      });
    });

    context('when passed possible primary', function () {
      it('returns false', function () {
        expect(isWritable(POSSIBLE_PRIMARY)).to.equal(false);
      });
    });

    context('when passed primary', function () {
      it('returns true', function () {
        expect(isWritable(RS_PRIMARY)).to.equal(true);
      });
    });

    context('when passed secondary', function () {
      it('returns false', function () {
        expect(isWritable(RS_SECONDARY)).to.equal(false);
      });
    });

    context('when passed arbiter', function () {
      it('returns false', function () {
        expect(isWritable(RS_ARBITER)).to.equal(false);
      });
    });

    context('when passed other', function () {
      it('returns false', function () {
        expect(isWritable(RS_OTHER)).to.equal(false);
      });
    });

    context('when passed ghost', function () {
      it('returns false', function () {
        expect(isWritable(RS_GHOST)).to.equal(false);
      });
    });

    context('when passed unknown', function () {
      it('returns false', function () {
        expect(isWritable(UNKNOWN)).to.equal(false);
      });
    });
  });
});

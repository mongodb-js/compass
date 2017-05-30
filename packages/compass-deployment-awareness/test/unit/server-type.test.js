const expect = require('chai').expect;
const ServerType = require('../../lib/models/server-type');

describe('ServerType', () => {
  describe('.isWritable', () => {
    context('when passed standalone', () => {
      it('returns true', () => {
        expect(ServerType.isWritable(ServerType.STANDALONE)).to.equal(true);
      });
    });

    context('when passed mongos', () => {
      it('returns true', () => {
        expect(ServerType.isWritable(ServerType.MONGOS)).to.equal(true);
      });
    });

    context('when passed possible primary', () => {
      it('returns false', () => {
        expect(ServerType.isWritable(ServerType.POSSIBLE_PRIMARY)).to.equal(false);
      });
    });

    context('when passed primary', () => {
      it('returns true', () => {
        expect(ServerType.isWritable(ServerType.RS_PRIMARY)).to.equal(true);
      });
    });

    context('when passed secondary', () => {
      it('returns false', () => {
        expect(ServerType.isWritable(ServerType.RS_SECONDARY)).to.equal(false);
      });
    });

    context('when passed arbiter', () => {
      it('returns false', () => {
        expect(ServerType.isWritable(ServerType.RS_ARBITER)).to.equal(false);
      });
    });

    context('when passed other', () => {
      it('returns false', () => {
        expect(ServerType.isWritable(ServerType.RS_OTHER)).to.equal(false);
      });
    });

    context('when passed ghost', () => {
      it('returns false', () => {
        expect(ServerType.isWritable(ServerType.RS_GHOST)).to.equal(false);
      });
    });

    context('when passed unknown', () => {
      it('returns false', () => {
        expect(ServerType.isWritable(ServerType.UNKNOWN)).to.equal(false);
      });
    });
  });
});

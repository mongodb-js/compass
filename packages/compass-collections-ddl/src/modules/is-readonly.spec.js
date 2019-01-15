import reducer from 'modules/is-readonly';

describe('is readonly module', () => {
  describe('#reducer', () => {
    context('when the HADRON_READONLY env is false', () => {
      before(() => {
        process.env.HADRON_READONLY = 'false';
      });

      it('returns the default state', () => {
        expect(reducer(undefined)).to.equal(false);
      });
    });
  });
});

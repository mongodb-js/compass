import reducer, { readStateChanged, INITIAL_STATE } from 'modules/is-readonly';

describe('is readonly module', () => {
  describe('#reducer', () => {
    context('when the HADRON_READONLY env is false', () => {
      before(() => {
        process.env.HADRON_READONLY = 'false';
      });

      context('when an action is provided with false', () => {
        it('returns the new state', () => {
          expect(reducer(undefined, readStateChanged(false))).to.equal(false);
        });
      });

      context('when an action is provided with true', () => {
        it('returns the new state', () => {
          expect(reducer(undefined, readStateChanged(true))).to.equal(true);
        });
      });

      context('when an action is not provided', () => {
        it('returns the default state', () => {
          expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
        });
      });
    });
  });

  context('when the HADRON_READONLY env is true', () => {
    before(() => {
      process.env.HADRON_READONLY = 'true';
    });

    context('when an action is provided with false', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, readStateChanged(false))).to.equal(false);
      });
    });

    context('when an action is provided with true', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, readStateChanged(true))).to.equal(true);
      });
    });

    context('when an action is not provided', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, {})).to.equal(INITIAL_STATE);
      });
    });
  });
});

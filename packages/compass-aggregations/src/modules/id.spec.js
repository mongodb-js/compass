import reducer, { createId, CREATE_ID } from 'modules/id';

describe('id module', () => {
  describe('#createId', () => {
    it('returns the CREATE_ID action', () => {
      expect(createId()).to.deep.equal({
        type: CREATE_ID
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not create id', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal('');
      });
    });

    context('when the action is create id', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, createId())).to.not.equal('');
      });
    });
  });
});

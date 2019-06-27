import reducer, { sourceNameChanged, SOURCE_NAME_CHANGED } from 'modules/source-name';

describe('sourceName module', () => {
  describe('#sourceNameChanged', () => {
    it('returns the SOURCE_NAME_CHANGED action', () => {
      expect(sourceNameChanged('testing')).to.deep.equal({
        type: SOURCE_NAME_CHANGED,
        sourceName: 'testing'
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not sourceName changed', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.equal(null);
      });
    });

    context('when the action is sourceName changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, sourceNameChanged('testing'))).to.equal('testing');
      });
    });
  });
});

import reducer, { saveState, SAVE_STATE, INITIAL_STATE } from 'modules/index';

describe('save current pipeline', () => {
  describe('#saveState', () => {
    it('returns a save state action type', () => {
      expect(saveState()).to.deep.equal({
        type: SAVE_STATE
      });
    });
  });

  describe('#savedState', () => {
    it('returns a new state object with correct keys', () => {
      expect(reducer(INITIAL_STATE, saveState())).to.contain.keys('inputDocuments', 'savedPipelines', 'namespace', 'stages', 'view');
    });
  });
});

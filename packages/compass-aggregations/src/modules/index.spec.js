import reducer, {
  saveState,
  SAVE_STATE,
  INITIAL_STATE,
  restoreState,
  RESTORE_STATE
} from 'modules/index';

describe('save current pipeline', () => {
  describe('#saveState', () => {
    it('returns a save state action type', () => {
      expect(saveState()).to.deep.equal({
        type: SAVE_STATE
      });
    });
  });

  describe('#savedState', () => {
    it('returns a new object with correct keys', () => {
      expect(reducer(INITIAL_STATE, saveState())).to.contain.keys('inputDocuments', 'savedPipelines', 'namespace', 'stages', 'view');
    });
  });
});

describe('restore previous state', () => {
  describe('#restoreState', () => {
    it('returns a restore state action type', () => {
      expect(restoreState('1337')).to.deep.equal({
        type: RESTORE_STATE,
        stateId: '1337'
      });
    });
  });

  describe('#restoredState', () => {
    it('should have a state object with inserted keys', () => {
      expect(reducer(INITIAL_STATE, restoreState('1337'))).to.contain.keys(
        'inputDocuments',
        'savedPipelines',
        'serverVersion',
        'dataService',
        'namespace',
        'fields',
        'stages',
        'view'
      );
    });

    // once indexeddb is added this should do a check on whether the saved
    // state properties are equal to restored state properties
    it('returns a new state object with correct keys', () => {
      const restoredState = reducer(INITIAL_STATE, restoreState('1337'));
      expect(restoredState.inputDocuments).to.deep.equal({});
    });
  });
});

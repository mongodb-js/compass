import reducer, {
  restoreState,
  RESTORE_STATE
} from 'modules/restore-state';

import { INITIAL_STATE } from 'modules/index';

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
        'pipeline',
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

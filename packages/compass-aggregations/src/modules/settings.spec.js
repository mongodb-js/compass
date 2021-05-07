import reducer, {
  TOGGLE_IS_EXPANDED,
  TOGGLE_COMMENT_MODE,
  SET_SAMPLE_SIZE,
  SET_MAX_TIME_MS,
  SET_LIMIT,
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsMaxTimeMS,
  setSettingsLimit,
  INITIAL_STATE
} from './settings';

describe('settings', () => {
  describe('action creators', () => {
    describe('#toggleSettingsIsExpanded', () => {
      it('returns the action type', () => {
        expect(toggleSettingsIsExpanded()).to.deep.equal({
          type: TOGGLE_IS_EXPANDED
        });
      });
      describe('#reducer', () => {
        let state;
        it('isExpanded is set to true', () => {
          state = reducer(INITIAL_STATE, toggleSettingsIsExpanded());
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isExpanded: true,
            isDirty: false
          });
        });

        it('isExpanded is set to false', () => {
          state = {
            ...INITIAL_STATE,
            isExpanded: true,
            isDirty: true
          };
          expect(reducer(state, toggleSettingsIsExpanded())).to.deep.equal({
            ...INITIAL_STATE,
            isExpanded: false
          });
        });
      });
    });

    describe('#toggleSettingsCommentMode', () => {
      it('returns the action type', () => {
        expect(toggleSettingsIsCommentMode()).to.deep.equal({
          type: TOGGLE_COMMENT_MODE
        });
      });
      describe('#reducer', () => {
        let state;
        it('first toggles to off', () => {
          state = reducer(undefined, toggleSettingsIsCommentMode());
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isCommentMode: false,
            isDirty: true
          });
        });

        it('next toggles to back on is set to false', () => {
          state = {
            ...INITIAL_STATE,
            isCommentMode: false,
            isDirty: true
          };
          expect(reducer(state, toggleSettingsIsCommentMode())).to.deep.equal({
            ...INITIAL_STATE,
            isCommentMode: true,
            isDirty: true
          });
        });
      });
    });

    describe('#setSettingsSampleSize', () => {
      it('returns the action type', () => {
        expect(setSettingsSampleSize(1)).to.deep.equal({
          type: SET_SAMPLE_SIZE,
          value: 1
        });
      });
      describe('#reducer', () => {
        let state;
        it('passes the value and flips isDefault', () => {
          state = reducer(undefined, setSettingsSampleSize(1000));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isDirty: true,
            sampleSize: 1000
          });
        });
        it('setting the value again back to a default flips it back', () => {
          state = reducer(
            state,
            setSettingsSampleSize(INITIAL_STATE.sampleSize)
          );
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isDirty: true,
            sampleSize: INITIAL_STATE.sampleSize
          });
        });
      });
    });

    describe('#setSettingsMaxTimeMS', () => {
      it('returns the action type', () => {
        expect(setSettingsMaxTimeMS(10000)).to.deep.equal({
          type: SET_MAX_TIME_MS,
          value: 10000
        });
      });
      describe('#reducer', () => {
        let state;
        it('passes the value and flips isDefault', () => {
          state = reducer(undefined, setSettingsMaxTimeMS(10000));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isDirty: true,
            maxTimeMS: 10000
          });
        });
        it('setting the value again back to a default flips it back', () => {
          state = reducer(state, setSettingsMaxTimeMS(INITIAL_STATE.maxTimeMS));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            maxTimeMS: INITIAL_STATE.maxTimeMS,
            isDirty: true
          });
        });
      });
    });

    describe('#setSettingsLimit', () => {
      it('returns the action type', () => {
        expect(setSettingsLimit(10000)).to.deep.equal({
          type: SET_LIMIT,
          value: 10000
        });
      });
      describe('#reducer', () => {
        let state;
        it('passes the value and flips isDefault', () => {
          state = reducer(undefined, setSettingsLimit(10000));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            limit: 10000,
            isDirty: true
          });
        });
        it('setting the value again back to a default flips it back', () => {
          state = reducer(state, setSettingsLimit(INITIAL_STATE.limit));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            limit: INITIAL_STATE.limit,
            isDirty: true
          });
        });
      });
    });
  });
});

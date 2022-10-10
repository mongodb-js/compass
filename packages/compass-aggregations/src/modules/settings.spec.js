import reducer, {
  TOGGLE_IS_EXPANDED,
  TOGGLE_COMMENT_MODE,
  SET_SAMPLE_SIZE,
  SET_LIMIT,
  toggleSettingsIsExpanded,
  toggleSettingsIsCommentMode,
  setSettingsSampleSize,
  setSettingsLimit,
  INITIAL_STATE
} from './settings';
import { expect } from 'chai';

describe('settings', function() {
  describe('action creators', function() {
    describe('#toggleSettingsIsExpanded', function() {
      it('returns the action type', function() {
        expect(toggleSettingsIsExpanded()).to.deep.equal({
          type: TOGGLE_IS_EXPANDED
        });
      });
      describe('#reducer', function() {
        let state;
        it('isExpanded is set to true', function() {
          state = reducer(INITIAL_STATE, toggleSettingsIsExpanded());
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isExpanded: true,
            isDirty: false
          });
        });

        it('isExpanded is set to false', function() {
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

    describe('#toggleSettingsCommentMode', function() {
      it('returns the action type', function() {
        expect(toggleSettingsIsCommentMode()).to.deep.equal({
          type: TOGGLE_COMMENT_MODE
        });
      });
      describe('#reducer', function() {
        let state;
        it('first toggles to off', function() {
          state = reducer(undefined, toggleSettingsIsCommentMode());
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isCommentMode: false,
            isDirty: true
          });
        });

        it('next toggles to back on is set to false', function() {
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

    describe('#setSettingsSampleSize', function() {
      it('returns the action type', function() {
        expect(setSettingsSampleSize(1)).to.deep.equal({
          type: SET_SAMPLE_SIZE,
          value: 1
        });
      });
      describe('#reducer', function() {
        let state;
        it('passes the value and flips isDefault', function() {
          state = reducer(undefined, setSettingsSampleSize(1000));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            isDirty: true,
            sampleSize: 1000
          });
        });
        it('setting the value again back to a default flips it back', function() {
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

    describe('#setSettingsLimit', function() {
      it('returns the action type', function() {
        expect(setSettingsLimit(10000)).to.deep.equal({
          type: SET_LIMIT,
          value: 10000
        });
      });
      describe('#reducer', function() {
        let state;
        it('passes the value and flips isDefault', function() {
          state = reducer(undefined, setSettingsLimit(10000));
          expect(state).to.deep.equal({
            ...INITIAL_STATE,
            limit: 10000,
            isDirty: true
          });
        });
        it('setting the value again back to a default flips it back', function() {
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

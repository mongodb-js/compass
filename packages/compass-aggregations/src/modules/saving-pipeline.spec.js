import reducer, {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen,
  SAVING_PIPELINE_NAME_CHANGED,
  SAVING_PIPELINE_APPLY,
  SAVING_PIPELINE_CANCEL,
  SAVING_PIPELINE_OPEN,
  INITIAL_STATE
} from 'modules/saving-pipeline';

describe('saving-pipeline module', () => {
  describe('#savingPipelineNameChanged', () => {
    it('returns the SAVING_PIPELINE_NAME_CHANGED action', () => {
      expect(savingPipelineNameChanged('testing')).to.deep.equal({
        type: SAVING_PIPELINE_NAME_CHANGED,
        name: 'testing'
      });
    });
    describe('#reducer', () => {
      describe('when the action is not name changed', () => {
        it('returns the default state', () => {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineApply', () => {
    it('returns the SAVING_PIPELINE_APPLY action', () => {
      expect(savingPipelineApply()).to.deep.equal({
        type: SAVING_PIPELINE_APPLY
      });
    });
    describe('#reducer', () => {
      describe('when the action is not apply', () => {
        it('returns the default state', () => {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineCancel', () => {
    it('returns the SAVING_PIPELINE_CANCEL action', () => {
      expect(savingPipelineCancel()).to.deep.equal({
        type: SAVING_PIPELINE_CANCEL
      });
    });
    describe('#reducer', () => {
      describe('when the action is not apply', () => {
        it('returns the default state', () => {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineOpen', () => {
    it('returns the SAVING_PIPELINE_OPEN action', () => {
      expect(savingPipelineOpen()).to.deep.equal({
        type: SAVING_PIPELINE_OPEN,
        isSaveAs: false,
        name: ''
      });
    });
    describe('#reducer', () => {
      describe('when the action is not apply', () => {
        it('returns the default state', () => {
          expect(reducer(undefined, {
            type: 'test'
          })).to.equal(INITIAL_STATE);
        });
      });
    });
  });
});

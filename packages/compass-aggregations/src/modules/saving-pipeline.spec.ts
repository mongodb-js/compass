import reducer, {
  savingPipelineNameChanged,
  savingPipelineApply,
  savingPipelineCancel,
  savingPipelineOpen,
  SAVING_PIPELINE_NAME_CHANGED,
  SAVING_PIPELINE_APPLY,
  SAVING_PIPELINE_CANCEL,
  SAVING_PIPELINE_OPEN,
  INITIAL_STATE,
} from './saving-pipeline';
import { expect } from 'chai';
import Sinon from 'sinon';

describe('saving-pipeline module', function () {
  describe('#savingPipelineNameChanged', function () {
    it('returns the SAVING_PIPELINE_NAME_CHANGED action', function () {
      expect(savingPipelineNameChanged('testing')).to.deep.equal({
        type: SAVING_PIPELINE_NAME_CHANGED,
        name: 'testing',
      });
    });
    describe('#reducer', function () {
      describe('when the action is not name changed', function () {
        it('returns the default state', function () {
          expect(
            reducer(undefined, {
              type: 'test',
            } as any)
          ).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineApply', function () {
    it('returns the SAVING_PIPELINE_APPLY action', function () {
      const dispatchSpy = Sinon.spy();
      savingPipelineApply()(
        dispatchSpy,
        () =>
          ({
            // The thunk reads name + description + mcpPromptName from
            // the saving-pipeline modal slice and dispatches all three.
            savingPipeline: {
              name: 'test',
              description: '',
              mcpPromptName: '',
            },
          } as any),
        {} as any
      );
      expect(dispatchSpy).to.be.calledOnceWith({
        type: SAVING_PIPELINE_APPLY,
        name: 'test',
        description: '',
        mcpPromptName: '',
      });
    });

    it('forwards description and mcpPromptName when present', function () {
      const dispatchSpy = Sinon.spy();
      savingPipelineApply()(
        dispatchSpy,
        () =>
          ({
            savingPipeline: {
              name: 'monthly-revenue',
              description: '  Q4 2025 revenue   ',
              mcpPromptName: '  monthly-revenue  ',
            },
          } as any),
        {} as any
      );
      // Whitespace is trimmed before dispatch (matches the query-bar
      // dialog's behavior and prevents pad-only fields from saving).
      expect(dispatchSpy).to.be.calledOnceWith({
        type: SAVING_PIPELINE_APPLY,
        name: 'monthly-revenue',
        description: 'Q4 2025 revenue',
        mcpPromptName: 'monthly-revenue',
      });
    });
    describe('#reducer', function () {
      describe('when the action is not apply', function () {
        it('returns the default state', function () {
          expect(
            reducer(undefined, {
              type: 'test',
            } as any)
          ).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineCancel', function () {
    it('returns the SAVING_PIPELINE_CANCEL action', function () {
      expect(savingPipelineCancel()).to.deep.equal({
        type: SAVING_PIPELINE_CANCEL,
      });
    });
    describe('#reducer', function () {
      describe('when the action is not apply', function () {
        it('returns the default state', function () {
          expect(
            reducer(undefined, {
              type: 'test',
            } as any)
          ).to.equal(INITIAL_STATE);
        });
      });
    });
  });
  describe('#savingPipelineOpen', function () {
    it('returns the SAVING_PIPELINE_OPEN action', function () {
      expect(savingPipelineOpen()).to.deep.equal({
        type: SAVING_PIPELINE_OPEN,
        isSaveAs: false,
        name: '',
        description: '',
        mcpPromptName: '',
      });
    });
    describe('#reducer', function () {
      describe('when the action is not apply', function () {
        it('returns the default state', function () {
          expect(
            reducer(undefined, {
              type: 'test',
            } as any)
          ).to.equal(INITIAL_STATE);
        });
      });
    });
  });
});

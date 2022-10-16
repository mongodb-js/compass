import _reducer, {
  stageAdded,
  stageChanged,
  stageCollapseToggled,
  stageAddedAfter,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stagePreviewUpdated,
  stageToggled,
  loadingStageResults,
  gotoOutResults,
  STAGE_COLLAPSE_TOGGLED,
  STAGE_PREVIEW_UPDATED,
  LOADING_STAGE_RESULTS,
  STAGE_TOGGLED,
  replaceOperatorSnippetTokens,
  INITIAL_STATE,
  STAGE_ADDED,
  STAGE_ADDED_AFTER,
  STAGE_CHANGED,
  STAGE_DELETED,
  STAGE_MOVED,
  STAGE_OPERATOR_SELECTED,
  clearPipeline,
  CLEAR_PIPELINE,
} from './pipeline';
import sinon from 'sinon';
import { expect } from 'chai';
import { ON_PREM, STAGE_OPERATORS } from 'mongodb-ace-autocompleter';
import { PipelineBuilder } from './pipeline-builder/pipeline-builder';
import { mockDataService } from '../../test/mocks/data-service';

const reducer = (prevState = INITIAL_STATE, action) => {
  if (typeof action === 'function') {
    action(
      (a) => {
        prevState = reducer(prevState, a);
      },
      () => ({ pipeline: prevState }),
      {
        pipelineBuilder: new PipelineBuilder(mockDataService()),
      }
    );
  }
  return _reducer(prevState, action);
};

describe('pipeline module', function () {
  describe('#reducer', function () {
    context('when the action is undefined', function () {
      it('returns the default state', function () {
        expect(reducer(undefined, { type: 'test' })[0].stage).to.equal('');
      });
    });

    context('when the action is stage changed', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, stageChanged('{}', 0))[0].stage).to.equal(
          '{}'
        );
      });
    });

    context('when the action is stage collapse toggled', function () {
      it('returns the new state', function () {
        expect(
          reducer(undefined, stageCollapseToggled(0))[0].isExpanded
        ).to.equal(false);
      });
    });

    context('when the action is stage toggled', function () {
      it('returns the new state', function () {
        expect(reducer(undefined, stageToggled(0))[0].isEnabled).to.equal(
          false
        );
      });
    });

    context('when the action is stage operator selected', function () {
      context('when the stage is expanded', function () {
        it('returns the new state', function () {
          expect(
            reducer(undefined, stageOperatorSelected(0, '$collStats'))[0]
              .stageOperator
          ).to.equal('$collStats');
        });
      });

      context('when the stage is not expanded', function () {
        const state = [
          {
            isExpanded: false,
            stage: '',
          },
        ];

        it('set the stage to expanded', function () {
          expect(
            reducer(state, stageOperatorSelected(0, '$collStats'))[0].isExpanded
          ).to.equal(true);
        });

        it('returns the new state', function () {
          expect(
            reducer(state, stageOperatorSelected(0, '$collStats'))[0]
              .stageOperator
          ).to.equal('$collStats');
        });
      });

      context('when the stage operator is changed', function () {
        it('changes the stage value if its a new stage', function () {
          STAGE_OPERATORS.forEach(({ name, comment, snippet, env: envs }) => {
            envs.forEach((env) => {
              const newState = reducer(
                [{ stageOperator: '' }],
                stageOperatorSelected(0, name, true, env)
              );
              expect(
                newState[0].stageOperator,
                `${name} stageOperator on ${env} env.`
              ).to.equal(name);
              expect(
                newState[0].stage,
                `${name} stage on ${env} env.`
              ).to.equal(replaceOperatorSnippetTokens(`${comment}${snippet}`));
            });
          });
        });
        it('changes the stage value if no changes were made to stage', function () {
          const geoNear = STAGE_OPERATORS.find(
            ({ name }) => name === '$geoNear'
          );
          const stage = {
            stageOperator: geoNear.name,
            stage: replaceOperatorSnippetTokens(`${geoNear.comment}${geoNear.snippet}`),
          };
          STAGE_OPERATORS.filter((x) => x.name !== '$geoNear').forEach(
            ({ name, comment, snippet, env: envs }) => {
              envs.forEach((env) => {
                const newState = reducer(
                  [{ ...stage }],
                  stageOperatorSelected(0, name, true, env)
                );
                expect(
                  newState[0].stageOperator,
                  `${name} stageOperator on ${env} env.`
                ).to.equal(name);
                expect(
                  newState[0].stage,
                  `${name} stage on ${env} env.`
                ).to.equal(replaceOperatorSnippetTokens(`${comment}${snippet}`));
              });
            }
          );
        });
        it('does not change the stage value if stage contains changes', function () {
          const limit = STAGE_OPERATORS.find(({ name }) => name === '$limit');
          const stage = {
            stageOperator: limit.name,
            stage: '20',
          };
          STAGE_OPERATORS.filter((x) => x.name !== '$limit').forEach(
            ({ name, env: envs }) => {
              envs.forEach((env) => {
                const newState = reducer(
                  [{ ...stage }],
                  stageOperatorSelected(0, name, true, env)
                );
                expect(
                  newState[0].stageOperator,
                  `${name} stageOperator on ${env} env.`
                ).to.equal(name);
                expect(
                  newState[0].stage,
                  `${name} stage on ${env} env.`
                ).to.equal('20');
              });
            }
          );
        });
      });
    });

    context('when the action is stage added', function () {
      it('returns the new state with an additional stage', function () {
        expect(reducer(undefined, stageAdded()).length).to.equal(2);
      });
    });

    context('when the action is stage deleted', function () {
      it('returns the new state with the deleted stage', function () {
        expect(reducer(undefined, stageDeleted(0))).to.deep.equal([]);
      });
    });

    context('when the action is stage added after', function () {
      it('returns the new state with the added after stage', function () {
        expect(reducer(undefined, stageAddedAfter(0)).length).to.equal(2);
      });
    });

    context('when the action is stage preview updated', function () {
      const docs = [{ name: 'test' }];
      const action = stagePreviewUpdated(docs, 0, null);

      it('sets the preview documents', function () {
        expect(reducer(undefined, action)[0].previewDocuments).to.deep.equal(
          docs
        );
      });
    });

    context('when the action is loading stage results', function () {
      const action = loadingStageResults(0);

      it('sets the loading flag for the stage', function () {
        expect(reducer(undefined, action)[0].isLoading).to.equal(true);
      });
    });

    context('when the action is stage moved', function () {
      const state = [
        {
          stage: '{}',
          isValid: true,
          isEnabled: true,
          stageOperator: '$match',
          isExpanded: true,
        },
        {
          stage: '{ name: 1 }',
          isValid: true,
          isEnabled: true,
          stageOperator: '$project',
          isExpanded: true,
        },
        {
          stage: '{ name: -1 }',
          isValid: true,
          isEnabled: true,
          stageOperator: '$sort',
          isExpanded: true,
        },
      ];

      context('when moving to a higher position', function () {
        context('when not moving to the end', function () {
          const result = reducer(state, stageMoved(0, 1));

          it('shifts the pipeline from the toIndex lower', function () {
            expect(result[0].stage).to.equal('{ name: 1 }');
            expect(result[1].stage).to.equal('{}');
          });
        });

        context('when moving to the end', function () {
          const result = reducer(state, stageMoved(0, 2));

          it('shifts the pipeline from the toIndex lower', function () {
            expect(result[0].stage).to.equal('{ name: 1 }');
            expect(result[2].stage).to.equal('{}');
          });
        });
      });

      context('when moving to a lower position', function () {
        context('when the position is not the first', function () {
          it('shifts the pipeline from the toIndex higher', function () {
            expect(reducer(state, stageMoved(2, 1))).to.deep.equal([
              {
                stage: '{}',
                isValid: true,
                isEnabled: true,
                stageOperator: '$match',
                isExpanded: true,
              },
              {
                stage: '{ name: -1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$sort',
                isExpanded: true,
              },
              {
                stage: '{ name: 1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$project',
                isExpanded: true,
              },
            ]);
          });
        });

        context('when the position is the first', function () {
          it('shifts the pipeline from the toIndex higher', function () {
            expect(reducer(state, stageMoved(2, 0))).to.deep.equal([
              {
                stage: '{ name: -1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$sort',
                isExpanded: true,
              },
              {
                stage: '{}',
                isValid: true,
                isEnabled: true,
                stageOperator: '$match',
                isExpanded: true,
              },
              {
                stage: '{ name: 1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$project',
                isExpanded: true,
              },
            ]);
          });
        });
      });

      context('when moving to the same position', function () {
        it('returns the unmodified state', function () {
          expect(reducer(state, stageMoved(1, 1))).to.equal(state);
        });
      });
    });
  });

  describe('actions', function() {
    const pipeline = [
      {
        stageOperator: '$match',
        stage: `{name: /berlin/i}`,
        isEnabled: true,
      },
      {
        stageOperator: '$limit',
        stage: `20`,
        isEnabled: true,
      }
    ];
    const pipelineStr = `[{$match: {name: /berlin/i}}, {$limit: 20}]`;
    const pipelineBuilder = new PipelineBuilder(mockDataService);
    const getState = () => ({
      pipeline,
    });
    let dispatchSpy;
    const sandbox = sinon.createSandbox();

    beforeEach(function () {
      pipelineBuilder.reset(pipelineStr);
      dispatchSpy = sinon.spy();
      sandbox.spy(pipelineBuilder);
    });
    
    afterEach(function () {
      sandbox.restore();
    });

    it('#clearPipeline', function() {
      expect(clearPipeline()).to.deep.equal({
        type: CLEAR_PIPELINE,
      });
    });
    
    it('#stageAdded', function() {
      stageAdded()(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.addStage.getCalls()[0].args,
        'adds a stage in pipeline builder'
      ).to.deep.equal([]);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_ADDED,
      });
    });
    
    it('#stageAddedAfter', function() {
      stageAddedAfter(1)(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.addStage.getCalls()[0].args,
        'adds a stage after an index in pipeline builder'
      ).to.deep.equal([1]);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_ADDED_AFTER,
        index: 1,
      });
    });
    
    it('#stageChanged', function() {
      stageChanged('30', 1)(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.changeStageValue.getCalls()[0].args,
        'changes stage value in pipeline builder'
      ).to.deep.equal([1, '30']);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_CHANGED,
        index: 1,
        stage: '30',
        syntaxError: undefined,
      });
    });
    
    it('#stageCollapseToggled', function () {
      expect(stageCollapseToggled(0)).to.deep.equal({
        type: STAGE_COLLAPSE_TOGGLED,
        index: 0,
      });
    });
    
    it('#stageDeleted', function() {
      stageDeleted(0)(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.removeStage.getCalls()[0].args,
        'deletes a stage in pipeline builder'
      ).to.deep.equal([0]);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_DELETED,
        index: 0,
      });
    });
    
    it('#stageMoved', function() {
      stageMoved(1, 0)(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.moveStage.getCalls()[0].args,
        'moves a stage in pipeline builder'
      ).to.deep.equal([1, 0]);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_MOVED,
        fromIndex: 1,
        toIndex: 0
      });
    });
    
    it('#stageOperatorSelected - same stage operator selected', function() {
      stageOperatorSelected(0, '$match', false, ON_PREM)(dispatchSpy, getState, { pipelineBuilder });
      expect(dispatchSpy.callCount).to.equal(0);
      expect(
        pipelineBuilder.changeStageOperator.callCount
      ).to.equal(0);
    });
    
    it('#stageOperatorSelected - different stage operator selected', function() {
      stageOperatorSelected(0, '$unwind', false, ON_PREM)(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.changeStageOperator.getCalls()[0].args,
        'changes stage operator in pipeline builder'
      ).to.deep.equal([0, '$unwind']);
      expect(
        pipelineBuilder.changeStageValue.getCalls()[0].args,
        'changes stage value in pipeline builder'
      ).to.deep.equal([0, '{name: /berlin/i}']);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_OPERATOR_SELECTED,
        index: 0,
        attributes: {
          stageOperator: '$unwind',
          stage: '{name: /berlin/i}',
          isExpanded: true,
          isComplete: false,
          previewDocuments: [],
          isValid: true,
          syntaxError: undefined,
          error: null,
          isMissingAtlasOnlyStageSupport: false,
        }
      });
    });
    
    it('#stageToggled', function() {
      stageToggled(1)(dispatchSpy, getState, { pipelineBuilder });
      expect(
        pipelineBuilder.changeStageDisabled.getCalls()[0].args,
        'updates stage disabled in pipeline builder'
      ).to.deep.equal([1, true]);
      expect(
        dispatchSpy.getCalls()[0].args[0],
        'dispatchs correct action'
      ).to.deep.equal({
        type: STAGE_TOGGLED,
        index: 1,
        isEnabled: false,
      });
    });
    
    it('#stagePreviewUpdated - with out error', function () {
      stagePreviewUpdated(
        [{id: 1}],
        1,
        null, // error
        true, // isComplete
        'on-prem'
      )(dispatchSpy, getState);
      expect(dispatchSpy.getCalls()[0].args[0]).to.deep.equal({
        type: STAGE_PREVIEW_UPDATED,
        index: 1,
        attributes: {
          isLoading: false,
          isComplete: true,
          previewDocuments: [{id: 1}],
          error: null,
          isMissingAtlasOnlyStageSupport: false,
        }
      });
    });
    
    it('#stagePreviewUpdated - with error', function () {
      stagePreviewUpdated(
        [{id: 1}],
        1,
        new SyntaxError('Invalid string'), // error
        true, // isComplete
        'on-prem'
      )(dispatchSpy, getState);
      expect(dispatchSpy.getCalls()[0].args[0]).to.deep.equal({
        type: STAGE_PREVIEW_UPDATED,
        index: 1,
        attributes: {
          isLoading: false,
          isComplete: true,
          previewDocuments: [],
          error: 'Invalid string',
          isMissingAtlasOnlyStageSupport: false,
        }
      });
    });
    
    it('#loadingStageResults', function () {
      expect(loadingStageResults(2)).to.deep.equal({
        type: LOADING_STAGE_RESULTS,
        index: 2,
      });
    });
    
    it('#gotoOutResults - when a custom function exists', function () {
      const spy = sinon.spy();
      const getState = () => {
        return {
          outResultsFn: spy,
          namespace: 'db.coll',
        };
      };
      gotoOutResults('coll')(null, getState);
      expect(
        spy.calledWith('db.coll'),
        'calls the function with the namespace'
      ).to.equal(true);
    });
  });
});

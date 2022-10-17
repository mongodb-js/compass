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
  generatePipelineAsString,
} from './pipeline';
import sinon from 'sinon';
import { expect } from 'chai';
import { STAGE_OPERATORS } from '@mongodb-js/mongodb-constants';
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

  describe('#stageCollapseToggled', function () {
    it('returns the STAGE_COLLAPSE_TOGGLED action', function () {
      expect(stageCollapseToggled(0)).to.deep.equal({
        type: STAGE_COLLAPSE_TOGGLED,
        index: 0,
      });
    });
  });

  describe('#stageToggled', function () {
    it('returns the STAGE_TOGGLED action', function () {
      expect(stageToggled(0)).to.deep.equal({
        type: STAGE_TOGGLED,
        index: 0,
      });
    });
  });

  describe('#stagePreviewUpdated', function () {
    const docs = [];
    const error = new Error('test');

    it('returns the STAGE_PREVIEW_UPDATED action', function () {
      expect(
        stagePreviewUpdated(docs, 3, error, true, 'on-prem')
      ).to.deep.equal({
        type: STAGE_PREVIEW_UPDATED,
        documents: docs,
        index: 3,
        error: error,
        isComplete: true,
        env: 'on-prem',
      });
    });
  });

  describe('#loadingStageResults', function () {
    it('returns the LOADING_STAGE_RESULTS action', function () {
      expect(loadingStageResults(2)).to.deep.equal({
        type: LOADING_STAGE_RESULTS,
        index: 2,
      });
    });
  });

  describe('#gotoOutResults', function () {
    context('when a custom function exists', function () {
      const spy = sinon.spy();
      const getState = () => {
        return {
          outResultsFn: spy,
          namespace: 'db.coll',
        };
      };

      it('calls the function with the namespace', function () {
        gotoOutResults('coll')(null, getState);
        expect(spy.calledWith('db.coll')).to.equal(true);
      });
    });
  });

  describe('#generatePipelineAsString', function () {
    context('when the index is the first', function () {
      const stage = {
        isEnabled: true,
        executor: { $match: { name: 'test' } },
        enabled: true,
        stageOperator: '$match',
        stage: "{name: 'test'}",
      };
      const state = { inputDocuments: { count: 10000 }, pipeline: [stage] };

      it('returns the pipeline string with only the current stage', function () {
        expect(generatePipelineAsString(state, 0)).to.deep.equal(`[{
 $match: {
  name: 'test'
 }
}]`);
      });
    });

    context('when the index has prior stages', function () {
      const stage0 = {
        isEnabled: true,
        executor: { $match: { name: 'test' } },
        enabled: true,
        stageOperator: '$match',
        stage: "{name: 'test'}",
      };
      const stage1 = {
        isEnabled: true,
        executor: { $project: { name: 1 } },
        enabled: true,
        stageOperator: '$project',
        stage: '{name: 1}',
      };
      const stage2 = {
        isEnabled: true,
        executor: { $sort: { name: 1 } },
        enabled: true,
        stageOperator: '$sort',
        stage: '{name: 1}',
      };
      const state = {
        inputDocuments: { count: 10000 },
        pipeline: [stage0, stage1, stage2],
      };

      it('returns the pipeline string with the current and all previous stages', function () {
        expect(generatePipelineAsString(state, 2)).to.deep.equal(`[{
 $match: {
  name: 'test'
 }
}, {
 $project: {
  name: 1
 }
}, {
 $sort: {
  name: 1
 }
}]`);
      });
    });

    context('when the index has stages after', function () {
      const stage0 = {
        isEnabled: true,
        executor: { $match: { name: 'test' } },
        enabled: true,
        stageOperator: '$match',
        stage: "{name: 'test'}",
      };
      const stage1 = {
        isEnabled: true,
        executor: { $project: { name: 1 } },
        enabled: true,
        stageOperator: '$project',
        stage: '{name: 1}',
      };
      const stage2 = {
        isEnabled: true,
        executor: { $sort: { name: 1 } },
        enabled: true,
        stageOperator: '$sort',
        stage: '{name: 1}',
      };
      const state = {
        inputDocuments: { count: 10000 },
        pipeline: [stage0, stage1, stage2],
      };

      it('returns the pipeline string with the current and all previous stages', function () {
        expect(generatePipelineAsString(state, 1)).to.deep.equal(`[{
 $match: {
  name: 'test'
 }
}, {
 $project: {
  name: 1
 }
}]`);
      });
    });

    context('when a stage is disabled', function () {
      const stage0 = {
        isEnabled: false,
        executor: { $match: { name: 'test' } },
      };
      const stage1 = { isEnabled: true, executor: { $project: { name: 1 } } };
      const stage2 = { isEnabled: true, executor: { $sort: { name: 1 } } };
      const state = {
        inputDocuments: { count: 10000 },
        pipeline: [stage0, stage1, stage2],
      };

      it('returns pipeline as a string with the current and all previous stages', function () {
        expect(generatePipelineAsString(state, 2)).to.deep.equal('[{}, {}]');
      });
    });

    context('when there are no stages', function () {
      const state = { inputDocuments: { count: 10000 }, pipeline: [] };

      it('returns an empty pipeline string', function () {
        expect(generatePipelineAsString(state, 0)).to.deep.equal('[]');
      });
    });
  });
});

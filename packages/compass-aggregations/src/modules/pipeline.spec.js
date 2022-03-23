import reducer, {
  stageAdded,
  stageChanged,
  stageCollapseToggled,
  stageAddedAfter,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stagePreviewUpdated,
  stageToggled,
  generatePipeline,
  generatePipelineAsString,
  loadingStageResults,
  gotoOutResults,
  STAGE_ADDED,
  STAGE_ADDED_AFTER,
  STAGE_CHANGED,
  STAGE_COLLAPSE_TOGGLED,
  STAGE_DELETED,
  STAGE_MOVED,
  STAGE_OPERATOR_SELECTED,
  STAGE_PREVIEW_UPDATED,
  LOADING_STAGE_RESULTS,
  STAGE_TOGGLED
} from './pipeline';
import { generatePipelineStages } from './pipeline';
import sinon from 'sinon';
import { expect } from 'chai';

const LIMIT_TO_PROCESS = 100000;
const LIMIT_TO_DISPLAY = 20;

describe('pipeline module', function() {
  describe('#reducer', function() {
    context('when the action is undefined', function() {
      it('returns the default state', function() {
        expect(reducer(undefined, { type: 'test' })[0].stage).to.equal('');
      });
    });

    context('when the action is stage changed', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, stageChanged('{}', 0))[0].stage).to.equal('{}');
      });
    });

    context('when the action is stage collapse toggled', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, stageCollapseToggled(0))[0].isExpanded).to.equal(false);
      });
    });

    context('when the action is stage toggled', function() {
      it('returns the new state', function() {
        expect(reducer(undefined, stageToggled(0))[0].isEnabled).to.equal(false);
      });
    });

    context('when the action is stage operator selected', function() {
      context('when the stage is expanded', function() {
        it('returns the new state', function() {
          expect(reducer(undefined, stageOperatorSelected(0, '$collStats'))[0].stageOperator).
            to.equal('$collStats');
        });
      });

      context('when the stage is not expanded', function() {
        const state = [{
          isExpanded: false,
          stage: ''
        }];

        it('set the stage to expanded', function() {
          expect(reducer(state, stageOperatorSelected(0, '$collStats'))[0].isExpanded).
            to.equal(true);
        });

        it('returns the new state', function() {
          expect(reducer(state, stageOperatorSelected(0, '$collStats'))[0].stageOperator).
            to.equal('$collStats');
        });
      });
    });

    context('when the action is stage added', function() {
      it('returns the new state with an additional stage', function() {
        expect(reducer(undefined, stageAdded()).length).to.equal(2);
      });
    });

    context('when the action is stage deleted', function() {
      it('returns the new state with the deleted stage', function() {
        expect(reducer(undefined, stageDeleted(0))).to.deep.equal([]);
      });
    });

    context('when the action is stage added after', function() {
      it('returns the new state with the added after stage', function() {
        expect(reducer(undefined, stageAddedAfter(0)).length).to.equal(2);
      });
    });

    context('when the action is stage preview updated', function() {
      const docs = [{ name: 'test' }];
      const action = stagePreviewUpdated(docs, 0, null);

      it('sets the preview documents', function() {
        expect(reducer(undefined, action)[0].previewDocuments).to.deep.equal(docs);
      });
    });

    context('when the action is loading stage results', function() {
      const action = loadingStageResults(0);

      it('sets the loading flag for the stage', function() {
        expect(reducer(undefined, action)[0].isLoading).to.equal(true);
      });
    });

    context('when the action is stage moved', function() {
      const state = [
        {
          stage: '{}',
          isValid: true,
          isEnabled: true,
          stageOperator: '$match',
          isExpanded: true
        },
        {
          stage: '{ name: 1 }',
          isValid: true,
          isEnabled: true,
          stageOperator: '$project',
          isExpanded: true
        },
        {
          stage: '{ name: -1 }',
          isValid: true,
          isEnabled: true,
          stageOperator: '$sort',
          isExpanded: true
        }
      ];

      context('when moving to a higher position', function() {
        context('when not moving to the end', function() {
          const result = reducer(state, stageMoved(0, 1));

          it('shifts the pipeline from the toIndex lower', function() {
            expect(result[0].stage).to.equal('{ name: 1 }');
            expect(result[1].stage).to.equal('{}');
          });
        });

        context('when moving to the end', function() {
          const result = reducer(state, stageMoved(0, 2));

          it('shifts the pipeline from the toIndex lower', function() {
            expect(result[0].stage).to.equal('{ name: 1 }');
            expect(result[2].stage).to.equal('{}');
          });
        });
      });

      context('when moving to a lower position', function() {
        context('when the position is not the first', function() {
          it('shifts the pipeline from the toIndex higher', function() {
            expect(reducer(state, stageMoved(2, 1))).to.deep.equal([
              {
                stage: '{}',
                isValid: true,
                isEnabled: true,
                stageOperator: '$match',
                isExpanded: true
              },
              {
                stage: '{ name: -1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$sort',
                isExpanded: true
              },
              {
                stage: '{ name: 1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$project',
                isExpanded: true
              }
            ]);
          });
        });

        context('when the position is the first', function() {
          it('shifts the pipeline from the toIndex higher', function() {
            expect(reducer(state, stageMoved(2, 0))).to.deep.equal([
              {
                stage: '{ name: -1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$sort',
                isExpanded: true
              },
              {
                stage: '{}',
                isValid: true,
                isEnabled: true,
                stageOperator: '$match',
                isExpanded: true
              },
              {
                stage: '{ name: 1 }',
                isValid: true,
                isEnabled: true,
                stageOperator: '$project',
                isExpanded: true
              }
            ]);
          });
        });
      });

      context('when moving to the same position', function() {
        it('returns the unmodified state', function() {
          expect(reducer(state, stageMoved(1, 1))).to.equal(state);
        });
      });
    });
  });

  describe('#stageAdded', function() {
    it('returns the STAGE_ADDED action', function() {
      expect(stageAdded()).to.deep.equal({
        type: STAGE_ADDED
      });
    });
  });

  describe('#stageAddedAfter', function() {
    context('without checking sequence', function() {
      it('returns the STAGE_ADDED_AFTER action', function() {
        expect(stageAddedAfter(0)).to.deep.equal({
          type: STAGE_ADDED_AFTER,
          index: 0
        });
      });
    });

    context('with checking sequence', function() {
      const state = [
        {
          stage: '{ name: 1 }',
          isValid: true,
          isEnabled: true,
          stageOperator: '$project',
          isExpanded: true
        },
        {
          stage: '{ name: -1 }',
          isValid: true,
          isEnabled: true,
          stageOperator: '$sort',
          isExpanded: true
        }
      ];

      it('inserts new stage in the middle', function() {
        expect(reducer(state, stageAddedAfter(0))[1].stageOperator).to.equal(
          ''
        );
      });
    });
  });

  describe('#stageChanged', function() {
    it('returns the STAGE_CHANGED action', function() {
      expect(stageChanged('{}', 0)).to.deep.equal({
        type: STAGE_CHANGED,
        index: 0,
        stage: '{}'
      });
    });
  });

  describe('#stageCollapseToggled', function() {
    it('returns the STAGE_COLLAPSE_TOGGLED action', function() {
      expect(stageCollapseToggled(0)).to.deep.equal({
        type: STAGE_COLLAPSE_TOGGLED,
        index: 0
      });
    });
  });

  describe('#stageDeleted', function() {
    it('returns the STAGE_DELETED action', function() {
      expect(stageDeleted(0)).to.deep.equal({
        type: STAGE_DELETED,
        index: 0
      });
    });
  });

  describe('#stageOperatorSelected', function() {
    it('returns the STAGE_OPERATOR_SELECTED action', function() {
      expect(stageOperatorSelected(0, '$collStats', true, 'atlas')).to.deep.equal({
        type: STAGE_OPERATOR_SELECTED,
        index: 0,
        stageOperator: '$collStats',
        isCommenting: true,
        env: 'atlas'
      });
    });
  });

  describe('#stageToggled', function() {
    it('returns the STAGE_TOGGLED action', function() {
      expect(stageToggled(0)).to.deep.equal({
        type: STAGE_TOGGLED,
        index: 0
      });
    });
  });

  describe('#stageMoved', function() {
    it('returns the STAGE_MOVED action', function() {
      expect(stageMoved(0, 5)).to.deep.equal({
        type: STAGE_MOVED,
        fromIndex: 0,
        toIndex: 5
      });
    });
  });

  describe('#stagePreviewUpdated', function() {
    const docs = [];
    const error = new Error('test');

    it('returns the STAGE_PREVIEW_UPDATED action', function() {
      expect(stagePreviewUpdated(docs, 3, error, true, 'on-prem')).to.deep.equal({
        type: STAGE_PREVIEW_UPDATED,
        documents: docs,
        index: 3,
        error: error,
        isComplete: true,
        env: 'on-prem'
      });
    });
  });

  describe('#loadingStageResults', function() {
    it('returns the LOADING_STAGE_RESULTS action', function() {
      expect(loadingStageResults(2)).to.deep.equal({
        type: LOADING_STAGE_RESULTS,
        index: 2
      });
    });
  });

  describe('#gotoOutResults', function() {
    context('when a custom function exists', function() {
      const spy = sinon.spy();
      const getState = () => {
        return {
          outResultsFn: spy,
          namespace: 'db.coll'
        };
      };

      it('calls the function with the namespace', function() {
        gotoOutResults('coll')(null, getState);
        expect(spy.calledWith('db.coll')).to.equal(true);
      });
    });
  });

  describe('#generatePipeline + #generatePipelineAsString', function() {
    const limit = { $limit: LIMIT_TO_DISPLAY };

    context('when the index is the first', function() {
      const stage = {
        isEnabled: true, executor: { $match: { name: 'test' }},
        enabled: true, stageOperator: '$match', stage: '{name: \'test\'}'
      };
      const state = { inputDocuments: { count: 10000 }, pipeline: [ stage ]};

      it('returns the pipeline with only the current stage', function() {
        expect(generatePipeline(state, 0)).to.deep.equal([
          stage.executor,
          limit
        ]);
      });
      it('returns the pipeline string with only the current stage', function() {
        expect(generatePipelineAsString(state, 0)).to.deep.equal(`[{$match: {
 name: 'test'
}}]`);
      });
    });

    context('when the index has prior stages', function() {
      const stage0 = {
        isEnabled: true, executor: { $match: { name: 'test' }},
        enabled: true, stageOperator: '$match', stage: '{name: \'test\'}'
      };
      const stage1 = {
        isEnabled: true, executor: { $project: { name: 1 }},
        enabled: true, stageOperator: '$project', stage: '{name: 1}'
      };
      const stage2 = {
        isEnabled: true, executor: { $sort: { name: 1 }},
        enabled: true, stageOperator: '$sort', stage: '{name: 1}'
      };
      const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0, stage1, stage2 ] };

      it('returns the pipeline with the current and all previous stages', function() {
        expect(generatePipeline(state, 2)).to.deep.equal([
          stage0.executor,
          stage1.executor,
          stage2.executor,
          limit
        ]);
      });
      it('returns the pipeline string with the current and all previous stages', function() {
        expect(generatePipelineAsString(state, 2)).to.deep.equal(`[{$match: {
 name: 'test'
}}, {$project: {
 name: 1
}}, {$sort: {
 name: 1
}}]`
        );
      });
    });

    context('when the index has stages after', function() {
      const stage0 = {
        isEnabled: true, executor: { $match: { name: 'test' }},
        enabled: true, stageOperator: '$match', stage: '{name: \'test\'}'
      };
      const stage1 = {
        isEnabled: true, executor: { $project: { name: 1 }},
        enabled: true, stageOperator: '$project', stage: '{name: 1}'
      };
      const stage2 = {
        isEnabled: true, executor: { $sort: { name: 1 }},
        enabled: true, stageOperator: '$sort', stage: '{name: 1}'
      };
      const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0, stage1, stage2 ]};

      it('returns the pipeline with the current and all previous stages', function() {
        expect(generatePipeline(state, 1)).to.deep.equal([
          stage0.executor,
          stage1.executor,
          limit
        ]);
      });
      it('returns the pipeline string with the current and all previous stages', function() {
        expect(generatePipelineAsString(state, 1)).to.deep.equal(`[{$match: {
 name: 'test'
}}, {$project: {
 name: 1
}}]`);
      });
    });

    context('when a stage is disabled', function() {
      const stage0 = { isEnabled: false, executor: { $match: { name: 'test' }}};
      const stage1 = { isEnabled: true, executor: { $project: { name: 1 }}};
      const stage2 = { isEnabled: true, executor: { $sort: { name: 1 }}};
      const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0, stage1, stage2 ]};

      it('returns the pipeline with the current and all previous stages', function() {
        expect(generatePipeline(state, 2)).to.deep.equal([
          stage1.executor,
          stage2.executor,
          limit
        ]);
      });
      it('returns pipeline as a string with the current and all previous stages', function() {
        expect(generatePipelineAsString(state, 2)).to.deep.equal('[{}, {}]');
      });
    });

    context('when there are no stages', function() {
      const state = { inputDocuments: { count: 10000 }, pipeline: []};

      it('returns an empty pipeline', function() {
        expect(generatePipeline(state, 0)).to.deep.equal([]);
      });
      it('returns an empty pipeline string', function() {
        expect(generatePipelineAsString(state, 0)).to.deep.equal('[]');
      });
    });

    context('when the collection size is over the max threshold', function() {
      context('when the pipeline contains a $match', function() {
        const stage0 = { isEnabled: true, executor: { $match: { name: 'test' }}};
        const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ]};

        it(`sets only the ${LIMIT_TO_DISPLAY} limit on the end`, function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor,
            limit
          ]);
        });
      });

      context('when the pipeline contains a $group', function() {
        context('when the state is sampling', function() {
          const stage0 = {
            isEnabled: true,
            executor: { $group: { name: 'test' }},
            stageOperator: '$group'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: true };

          it(`sets the ${LIMIT_TO_PROCESS} limit before $group and the ${LIMIT_TO_DISPLAY} limit on the end`, function() {
            expect(generatePipeline(state, 0)).to.deep.equal([
              { $limit: LIMIT_TO_PROCESS },
              stage0.executor,
              limit
            ]);
          });
        });

        context('when the state is not sampling', function() {
          const stage0 = {
            isEnabled: true,
            executor: { $group: { name: 'test' }},
            stageOperator: '$group'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: false };

          it('does not prepend a limit', function() {
            expect(generatePipeline(state, 0)).to.deep.equal([
              stage0.executor,
              limit
            ]);
          });
        });
      });

      context('when the pipeline contains a $bucket', function() {
        context('when the state is sampling', function() {
          const stage0 = {
            isEnabled: true,
            executor: { $bucket: { name: 'test' }},
            stageOperator: '$bucket'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: true };

          it(`sets the ${LIMIT_TO_PROCESS} limit before $bucket and the ${LIMIT_TO_DISPLAY} limit on the end`, function() {
            expect(generatePipeline(state, 0)).to.deep.equal([
              { $limit: LIMIT_TO_PROCESS },
              stage0.executor,
              limit
            ]);
          });
        });

        context('when the state is not sampling', function() {
          const stage0 = {
            isEnabled: true,
            executor: { $bucket: { name: 'test' }},
            stageOperator: '$bucket'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: false };

          it('does not prepend a limit', function() {
            expect(generatePipeline(state, 0)).to.deep.equal([
              stage0.executor,
              limit
            ]);
          });
        });
      });

      context('when the pipeline contains a $bucketAuto', function() {
        context('when the state is sampling', function() {
          const stage0 = {
            isEnabled: true,
            executor: { $bucketAuto: { name: 'test' }},
            stageOperator: '$bucketAuto'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: true };

          it(`sets the ${LIMIT_TO_PROCESS} limit before $bucketAuto and the ${LIMIT_TO_DISPLAY} limit on the end`, function() {
            expect(generatePipeline(state, 0)).to.deep.equal([
              { $limit: LIMIT_TO_PROCESS },
              stage0.executor,
              limit
            ]);
          });
        });

        context('when the state is not sampling', function() {
          const stage0 = {
            isEnabled: true,
            executor: { $bucketAuto: { name: 'test' }},
            stageOperator: '$bucketAuto'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: false };

          it('does not prepend a limit', function() {
            expect(generatePipeline(state, 0)).to.deep.equal([
              stage0.executor,
              limit
            ]);
          });
        });
      });

      context('when the pipeline contains a $sort', function() {
        const stage0 = {
          isEnabled: true,
          executor: { $sort: { name: 1 }},
          stageOperator: '$sort'
        };
        const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ]};

        it(`sets only the ${LIMIT_TO_DISPLAY} limit on the end`, function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor,
            limit
          ]);
        });
      });
    });

    context('when the stage is required to be the first', function() {
      context('when the stage is $collStats', function() {
        const stage0 = { isEnabled: true, executor: { $collStats: {}}, stageOperator: '$collStats' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $currentOp', function() {
        const stage0 = { isEnabled: true, executor: { $currentOp: {}}, stageOperator: '$currentOp' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $indexStats', function() {
        const stage0 = { isEnabled: true, executor: { $collStats: {}}, stageOperator: '$indexStats' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $listLocalSessions', function() {
        const stage0 = { isEnabled: true, executor: { $listLocalSessions: {}}, stageOperator: '$listLocalSessions' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $listSessions', function() {
        const stage0 = { isEnabled: true, executor: { $listSessions: {}}, stageOperator: '$listSessions' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $out', function() {
        const stage0 = { isEnabled: true, executor: { $out: 'testing' }, stageOperator: '$out' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current, all previous stages and limit', function() {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor,
            limit
          ]);
        });

        it('returns the pipeline stages with the current and all previous stages', function() {
          expect(generatePipelineStages(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });
    });
  });
});

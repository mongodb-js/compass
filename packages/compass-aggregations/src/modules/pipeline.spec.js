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
} from 'modules/pipeline';

const LIMIT_TO_PROCESS = 100000;
const LIMIT_TO_DISPLAY = 20;

describe('pipeline module', () => {
  describe('#reducer', () => {
    context('when the action is undefined', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })[0].stage).to.equal('');
      });
    });

    context('when the action is stage changed', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageChanged('{}', 0))[0].stage).to.equal('{}');
      });
    });

    context('when the action is stage collapse toggled', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageCollapseToggled(0))[0].isExpanded).to.equal(false);
      });
    });

    context('when the action is stage toggled', () => {
      it('returns the new state', () => {
        expect(reducer(undefined, stageToggled(0))[0].isEnabled).to.equal(false);
      });
    });

    context('when the action is stage operator selected', () => {
      context('when the stage is expanded', () => {
        it('returns the new state', () => {
          expect(reducer(undefined, stageOperatorSelected(0, '$collStats'))[0].stageOperator).
            to.equal('$collStats');
        });
      });

      context('when the stage is not expanded', () => {
        const state = [{
          isExpanded: false,
          stage: ''
        }];

        it('set the stage to expanded', () => {
          expect(reducer(state, stageOperatorSelected(0, '$collStats'))[0].isExpanded).
            to.equal(true);
        });

        it('returns the new state', () => {
          expect(reducer(state, stageOperatorSelected(0, '$collStats'))[0].stageOperator).
            to.equal('$collStats');
        });
      });
    });

    context('when the action is stage added', () => {
      it('returns the new state with an additional stage', () => {
        expect(reducer(undefined, stageAdded()).length).to.equal(2);
      });
    });

    context('when the action is stage deleted', () => {
      it('returns the new state with the deleted stage', () => {
        expect(reducer(undefined, stageDeleted(0))).to.deep.equal([]);
      });
    });

    context('when the action is stage added after', () => {
      it('returns the new state with the added after stage', () => {
        expect(reducer(undefined, stageAddedAfter(0)).length).to.equal(2);
      });
    });

    context('when the action is stage preview updated', () => {
      const docs = [{ name: 'test' }];
      const action = stagePreviewUpdated(docs, 0, null);

      it('sets the preview documents', () => {
        expect(reducer(undefined, action)[0].previewDocuments).to.deep.equal(docs);
      });
    });

    context('when the action is loading stage results', () => {
      const action = loadingStageResults(0);

      it('sets the loading flag for the stage', () => {
        expect(reducer(undefined, action)[0].isLoading).to.equal(true);
      });
    });

    context('when the action is stage moved', () => {
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

      context('when moving to a higher position', () => {
        context('when not moving to the end', () => {
          const result = reducer(state, stageMoved(0, 1));

          it('shifts the pipeline from the toIndex lower', () => {
            expect(result[0].stage).to.equal('{ name: 1 }');
            expect(result[1].stage).to.equal('{}');
          });
        });

        context('when moving to the end', () => {
          const result = reducer(state, stageMoved(0, 2));

          it('shifts the pipeline from the toIndex lower', () => {
            expect(result[0].stage).to.equal('{ name: 1 }');
            expect(result[2].stage).to.equal('{}');
          });
        });
      });

      context('when moving to a lower position', () => {
        context('when the position is not the first', () => {
          it('shifts the pipeline from the toIndex higher', () => {
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

        context('when the position is the first', () => {
          it('shifts the pipeline from the toIndex higher', () => {
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

      context('when moving to the same position', () => {
        it('returns the unmodified state', () => {
          expect(reducer(state, stageMoved(1, 1))).to.equal(state);
        });
      });
    });
  });

  describe('#stageAdded', () => {
    it('returns the STAGE_ADDED action', () => {
      expect(stageAdded()).to.deep.equal({
        type: STAGE_ADDED
      });
    });
  });

  describe('#stageAddedAfter', () => {
    context('without checking sequence', () => {
      it('returns the STAGE_ADDED_AFTER action', () => {
        expect(stageAddedAfter(0)).to.deep.equal({
          type: STAGE_ADDED_AFTER,
          index: 0
        });
      });
    });

    context('with checking sequence', () => {
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

      it('inserts new stage in the middle', () => {
        expect(reducer(state, stageAddedAfter(0))[1].stageOperator).to.equal(null);
      });
    });
  });

  describe('#stageChanged', () => {
    it('returns the STAGE_CHANGED action', () => {
      expect(stageChanged('{}', 0)).to.deep.equal({
        type: STAGE_CHANGED,
        index: 0,
        stage: '{}'
      });
    });
  });

  describe('#stageCollapseToggled', () => {
    it('returns the STAGE_COLLAPSE_TOGGLED action', () => {
      expect(stageCollapseToggled(0)).to.deep.equal({
        type: STAGE_COLLAPSE_TOGGLED,
        index: 0
      });
    });
  });

  describe('#stageDeleted', () => {
    it('returns the STAGE_DELETED action', () => {
      expect(stageDeleted(0)).to.deep.equal({
        type: STAGE_DELETED,
        index: 0
      });
    });
  });

  describe('#stageOperatorSelected', () => {
    it('returns the STAGE_OPERATOR_SELECTED action', () => {
      expect(stageOperatorSelected(0, '$collStats', true, 'atlas')).to.deep.equal({
        type: STAGE_OPERATOR_SELECTED,
        index: 0,
        stageOperator: '$collStats',
        isCommenting: true,
        env: 'atlas'
      });
    });
  });

  describe('#stageToggled', () => {
    it('returns the STAGE_TOGGLED action', () => {
      expect(stageToggled(0)).to.deep.equal({
        type: STAGE_TOGGLED,
        index: 0
      });
    });
  });

  describe('#stageMoved', () => {
    it('returns the STAGE_MOVED action', () => {
      expect(stageMoved(0, 5)).to.deep.equal({
        type: STAGE_MOVED,
        fromIndex: 0,
        toIndex: 5
      });
    });
  });

  describe('#stagePreviewUpdated', () => {
    const docs = [];
    const error = new Error('test');

    it('returns the STAGE_PREVIEW_UPDATED action', () => {
      expect(stagePreviewUpdated(docs, 3, error, true)).to.deep.equal({
        type: STAGE_PREVIEW_UPDATED,
        documents: docs,
        index: 3,
        error: error,
        isComplete: true
      });
    });
  });

  describe('#loadingStageResults', () => {
    it('returns the LOADING_STAGE_RESULTS action', () => {
      expect(loadingStageResults(2)).to.deep.equal({
        type: LOADING_STAGE_RESULTS,
        index: 2
      });
    });
  });

  describe('#gotoOutResults', () => {
    context('when a custom function exists', () => {
      const spy = sinon.spy();
      const getState = () => {
        return {
          outResultsFn: spy,
          namespace: 'db.coll'
        };
      };

      it('calls the function with the namespace', () => {
        gotoOutResults('coll')(null, getState);
        expect(spy.calledWith('db.coll')).to.equal(true);
      });
    });
  });

  describe('#generatePipeline + #generatePipelineAsString', () => {
    const limit = { $limit: LIMIT_TO_DISPLAY };

    context('when the index is the first', () => {
      const stage = {
        isEnabled: true, executor: { $match: { name: 'test' }},
        enabled: true, stageOperator: '$match', stage: '{name: \'test\'}'
      };
      const state = { inputDocuments: { count: 10000 }, pipeline: [ stage ]};

      it('returns the pipeline with only the current stage', () => {
        expect(generatePipeline(state, 0)).to.deep.equal([
          stage.executor,
          limit
        ]);
      });
      it('returns the pipeline string with only the current stage', () => {
        expect(generatePipelineAsString(state, 0)).to.deep.equal('[{$match: {name: \'test\'}}]');
      });
    });

    context('when the index has prior stages', () => {
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
      const state = {inputDocuments: { count: 10000 }, pipeline: [ stage0, stage1, stage2 ]};

      it('returns the pipeline with the current and all previous stages', () => {
        expect(generatePipeline(state, 2)).to.deep.equal([
          stage0.executor,
          stage1.executor,
          stage2.executor,
          limit
        ]);
      });
      it('returns the pipeline string with the current and all previous stages', () => {
        expect(generatePipelineAsString(state, 2)).to.deep.equal(
          "[{$match: {name: 'test'}}, {$project: {name: 1}}, {$sort: {name: 1}}]"
        );
      });
    });

    context('when the index has stages after', () => {
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

      it('returns the pipeline with the current and all previous stages', () => {
        expect(generatePipeline(state, 1)).to.deep.equal([
          stage0.executor,
          stage1.executor,
          limit
        ]);
      });
      it('returns the pipeline string with the current and all previous stages', () => {
        expect(generatePipelineAsString(state, 1)).to.deep.equal(
          "[{$match: {name: 'test'}}, {$project: {name: 1}}]"
        );
      });
    });

    context('when a stage is disabled', () => {
      const stage0 = { isEnabled: false, executor: { $match: { name: 'test' }}};
      const stage1 = { isEnabled: true, executor: { $project: { name: 1 }}};
      const stage2 = { isEnabled: true, executor: { $sort: { name: 1 }}};
      const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0, stage1, stage2 ]};

      it('returns the pipeline with the current and all previous stages', () => {
        expect(generatePipeline(state, 2)).to.deep.equal([
          stage1.executor,
          stage2.executor,
          limit
        ]);
      });
      it('returns the pipeline with the current and all previous stages', () => {
        expect(generatePipelineAsString(state, 2)).to.deep.equal('[{}, {}]');
      });
    });

    context('when there are no stages', () => {
      const state = { inputDocuments: { count: 10000 }, pipeline: []};

      it('returns an empty pipeline', () => {
        expect(generatePipeline(state, 0)).to.deep.equal([]);
      });
      it('returns an empty pipeline string', () => {
        expect(generatePipelineAsString(state, 0)).to.deep.equal('[]');
      });
    });

    context('when the collection size is over the max threshold', () => {
      context('when the pipeline contains a $match', () => {
        const stage0 = { isEnabled: true, executor: { $match: { name: 'test' }}};
        const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ]};

        it(`sets only the ${LIMIT_TO_DISPLAY} limit on the end`, () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor,
            limit
          ]);
        });
      });

      context('when the pipeline contains a $group', () => {
        context('when the state is sampling', () => {
          const stage0 = {
            isEnabled: true,
            executor: { $group: { name: 'test' }},
            stageOperator: '$group'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: true };

          it(`sets the ${LIMIT_TO_PROCESS} limit before $group and the ${LIMIT_TO_DISPLAY} limit on the end`, () => {
            expect(generatePipeline(state, 0)).to.deep.equal([
              { $limit: LIMIT_TO_PROCESS },
              stage0.executor,
              limit
            ]);
          });
        });

        context('when the state is not sampling', () => {
          const stage0 = {
            isEnabled: true,
            executor: { $group: { name: 'test' }},
            stageOperator: '$group'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: false };

          it('does not prepend a limit', () => {
            expect(generatePipeline(state, 0)).to.deep.equal([
              stage0.executor,
              limit
            ]);
          });
        });
      });

      context('when the pipeline contains a $bucket', () => {
        context('when the state is sampling', () => {
          const stage0 = {
            isEnabled: true,
            executor: { $bucket: { name: 'test' }},
            stageOperator: '$bucket'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: true };

          it(`sets the ${LIMIT_TO_PROCESS} limit before $bucket and the ${LIMIT_TO_DISPLAY} limit on the end`, () => {
            expect(generatePipeline(state, 0)).to.deep.equal([
              { $limit: LIMIT_TO_PROCESS },
              stage0.executor,
              limit
            ]);
          });
        });

        context('when the state is not sampling', () => {
          const stage0 = {
            isEnabled: true,
            executor: { $bucket: { name: 'test' }},
            stageOperator: '$bucket'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: false };

          it('does not prepend a limit', () => {
            expect(generatePipeline(state, 0)).to.deep.equal([
              stage0.executor,
              limit
            ]);
          });
        });
      });

      context('when the pipeline contains a $bucketAuto', () => {
        context('when the state is sampling', () => {
          const stage0 = {
            isEnabled: true,
            executor: { $bucketAuto: { name: 'test' }},
            stageOperator: '$bucketAuto'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: true };

          it(`sets the ${LIMIT_TO_PROCESS} limit before $bucketAuto and the ${LIMIT_TO_DISPLAY} limit on the end`, () => {
            expect(generatePipeline(state, 0)).to.deep.equal([
              { $limit: LIMIT_TO_PROCESS },
              stage0.executor,
              limit
            ]);
          });
        });

        context('when the state is not sampling', () => {
          const stage0 = {
            isEnabled: true,
            executor: { $bucketAuto: { name: 'test' }},
            stageOperator: '$bucketAuto'
          };
          const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ], sample: false };

          it('does not prepend a limit', () => {
            expect(generatePipeline(state, 0)).to.deep.equal([
              stage0.executor,
              limit
            ]);
          });
        });
      });

      context('when the pipeline contains a $sort', () => {
        const stage0 = {
          isEnabled: true,
          executor: { $sort: { name: 1 }},
          stageOperator: '$sort'
        };
        const state = { inputDocuments: { count: 1000000 }, pipeline: [ stage0 ]};

        it(`sets only the ${LIMIT_TO_DISPLAY} limit on the end`, () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor,
            limit
          ]);
        });
      });
    });

    context('when the stage is required to be the first', () => {
      context('when the stage is $collStats', () => {
        const stage0 = { isEnabled: true, executor: { $collStats: {}}, stageOperator: '$collStats' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $currentOp', () => {
        const stage0 = { isEnabled: true, executor: { $currentOp: {}}, stageOperator: '$currentOp' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $indexStats', () => {
        const stage0 = { isEnabled: true, executor: { $collStats: {}}, stageOperator: '$indexStats' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $listLocalSessions', () => {
        const stage0 = { isEnabled: true, executor: { $listLocalSessions: {}}, stageOperator: '$listLocalSessions' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $listSessions', () => {
        const stage0 = { isEnabled: true, executor: { $listSessions: {}}, stageOperator: '$listSessions' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });

      context('when the stage is $out', () => {
        const stage0 = { isEnabled: true, executor: { $out: 'testing' }, stageOperator: '$out' };
        const state = { inputDocuments: { count: 10000 }, pipeline: [ stage0 ]};

        it('returns the pipeline with the current and all previous stages', () => {
          expect(generatePipeline(state, 0)).to.deep.equal([
            stage0.executor
          ]);
        });
      });
    });
  });
});

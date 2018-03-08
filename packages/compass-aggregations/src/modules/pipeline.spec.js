import reducer, {
  stageAdded,
  stageChanged,
  stageCollapseToggled,
  stageDeleted,
  stageMoved,
  stageOperatorSelected,
  stagePreviewUpdated,
  stageToggled,
  generatePipeline,
  loadingStageResults,
  STAGE_ADDED,
  STAGE_CHANGED,
  STAGE_COLLAPSE_TOGGLED,
  STAGE_DELETED,
  STAGE_MOVED,
  STAGE_OPERATOR_SELECTED,
  STAGE_PREVIEW_UPDATED,
  LOADING_STAGE_RESULTS,
  STAGE_TOGGLED } from 'modules/pipeline';

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
      expect(stageOperatorSelected(0, '$collStats')).to.deep.equal({
        type: STAGE_OPERATOR_SELECTED,
        index: 0,
        stageOperator: '$collStats'
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
      expect(stagePreviewUpdated(docs, 3, error)).to.deep.equal({
        type: STAGE_PREVIEW_UPDATED,
        documents: docs,
        index: 3,
        error: error
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

  describe('#generatePipeline', () => {
    context('when the index is the first', () => {
      const stage = { executor: { $match: { name: 'test' }}};
      const state = { pipeline: [ stage ]};

      it('returns the pipeline with only the current stage', () => {
        expect(generatePipeline(state, 0)).to.deep.equal([ stage.executor ]);
      });
    });

    context('when the index has prior stages', () => {
      const stage0 = { executor: { $match: { name: 'test' }}};
      const stage1 = { executor: { $project: { name: 1 }}};
      const stage2 = { executor: { $sort: { name: 1 }}};
      const state = { pipeline: [ stage0, stage1, stage2 ]};

      it('returns the pipeline with the current and all previous stages', () => {
        expect(generatePipeline(state, 2)).to.deep.equal([
          stage0.executor,
          stage1.executor,
          stage2.executor
        ]);
      });
    });

    context('when the index has stages after', () => {
      const stage0 = { executor: { $match: { name: 'test' }}};
      const stage1 = { executor: { $project: { name: 1 }}};
      const stage2 = { executor: { $sort: { name: 1 }}};
      const state = { pipeline: [ stage0, stage1, stage2 ]};

      it('returns the pipeline with the current and all previous stages', () => {
        expect(generatePipeline(state, 1)).to.deep.equal([
          stage0.executor,
          stage1.executor
        ]);
      });
    });
  });
});

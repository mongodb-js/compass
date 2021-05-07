import reducer, {
  savedPipelinesListToggle,
  savedPipelineAdd,
  SAVED_PIPELINES_LIST_TOGGLED,
  SAVED_PIPELINE_ADD
} from '../../src/modules/saved-pipeline';

describe('saved pipelines module', () => {
  describe('#openSavedPipelines', () => {
    it('returns open action type', () => {
      expect(savedPipelinesListToggle(0)).to.deep.equal({
        type: SAVED_PIPELINES_LIST_TOGGLED,
        index: 0
      });
    });
  });

  describe('#addSavedPipelines', () => {
    it('returns an add saved pipelines action type', () => {
      expect(savedPipelineAdd({})).to.deep.equal({
        pipelines: {},
        type: SAVED_PIPELINE_ADD
      });
    });
  });

  describe('#reducer', () => {
    context('action type is close saved pipelines', () => {
      it('isListVisible is set to false', () => {
        expect(reducer(undefined, savedPipelinesListToggle(0))).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: false
        });
      });
    });

    context('action type is open saved pipelines', () => {
      it('isListVisible is set to true', () => {
        expect(reducer(undefined, savedPipelinesListToggle(1))).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: true
        });
      });
    });

    context('an empty action type returns an initial state', () => {
      it('isListVisible is set to true', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          pipelines: [],
          isLoaded: false,
          isListVisible: false
        });
      });
    });

    context('action type is add saved pipelines', () => {
      it('returns new state with an additional pipeline item ', () => {
        const pipelines = [ { name: 'newPipeline' } ];
        expect(reducer(undefined, savedPipelineAdd(pipelines))).to.deep.equal({
          pipelines: pipelines,
          isLoaded: true,
          isListVisible: false
        });
      });
    });
  });
});

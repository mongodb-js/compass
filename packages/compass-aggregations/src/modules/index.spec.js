import reducer, {
  reset,
  clearPipeline,
  restoreSavedPipeline,
  clonePipeline,
  newPipeline,
  RESET,
  CLEAR_PIPELINE,
  RESTORE_PIPELINE,
  NEW_PIPELINE,
  CLONE_PIPELINE
} from 'modules';

describe('root [ module ]', () => {
  describe('#reset', () => {
    it('returns the action', () => {
      expect(reset()).to.deep.equal({
        type: RESET
      });
    });
  });

  describe('#clearPipeline', () => {
    it('returns the action', () => {
      expect(clearPipeline()).to.deep.equal({
        type: CLEAR_PIPELINE
      });
    });
  });

  describe('#restoreSavedPipeline', () => {
    it('returns the action', () => {
      expect(restoreSavedPipeline({ name: 'test' })).to.deep.equal({
        type: RESTORE_PIPELINE,
        restoreState: { name: 'test' }
      });
    });
  });

  describe('#newPipeline', () => {
    it('returns the NEW_PIPELINE action', () => {
      expect(newPipeline()).to.deep.equal({
        type: NEW_PIPELINE
      });
    });
  });

  describe('#clonePipeline', () => {
    it('returns the CLONE_PIPELINE action', () => {
      expect(clonePipeline()).to.deep.equal({
        type: CLONE_PIPELINE
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is NEW_PIPELINE', () => {
      const prevState = {
        dataService: 'test-ds',
        namespace: 'test.test',
        fields: 'test-fields',
        serverVersion: '3.6.0',
        inputDocuments: [ 'test' ]
      };

      let state;

      before(() => {
        state = reducer(prevState, newPipeline());
      });

      it('keeps the data service', () => {
        expect(state.dataService).to.equal('test-ds');
      });

      it('keeps the namespace', () => {
        expect(state.namespace).to.equal('test.test');
      });

      it('keeps the fields', () => {
        expect(state.fields).to.equal('test-fields');
      });

      it('keeps the server version', () => {
        expect(state.serverVersion).to.equal('3.6.0');
      });

      it('keeps the input documents', () => {
        expect(state.inputDocuments).to.deep.equal([ 'test' ]);
      });

      it('sets id to null', () => {
        expect(state.id).to.equal('');
      });
    });

    context('when the action is CLONE_PIPELINE', () => {
      const prevState = {
        id: 'testing',
        name: 'test'
      };

      let state;

      before(() => {
        state = reducer(prevState, clonePipeline());
      });

      it('sets id to a new id', () => {
        expect(state.id).to.not.equal('testing');
      });

      it('updates the name', () => {
        expect(state.name).to.equal('test (copy)');
      });
    });
  });
});

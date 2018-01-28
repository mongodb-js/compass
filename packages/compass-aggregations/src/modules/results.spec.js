import reducer, {
  resultsFetched,
  resultsErrored,
  execute,
  RESULTS_FETCHED,
  RESULTS_ERRORED,
  INITIAL_STATE,
  OPTIONS
} from 'modules/results';

describe('results module', () => {
  describe('#resultsFetched', () => {
    it('returns the RESULTS_FETCHED action', () => {
      const docs = [{ name: 'Aphex Twin' }];

      expect(resultsFetched(docs)).to.deep.equal({
        type: RESULTS_FETCHED,
        docs: docs
      });
    });
  });

  describe('#resultsErrored', () => {
    it('returns the RESULTS_ERRORED action', () => {
      const error = new Error('errored');

      expect(resultsErrored(error)).to.deep.equal({
        type: RESULTS_ERRORED,
        error: error
      });
    });
  });

  describe('#reducer', () => {
    context('when the action is not a mapped type', () => {
      it('returns the default state', () => {
        expect(reducer(undefined, { type: 'test' })).to.deep.equal(INITIAL_STATE);
      });
    });

    context('when the action is results fetched', () => {
      const docs = [{ name: 'Aphex Twin' }];

      it('returns the new state', () => {
        expect(reducer(undefined, resultsFetched(docs))).to.deep.equal({
          error: null,
          docs: docs
        });
      });
    });

    context('when the action is results errored', () => {
      const error = new Error('errored');

      it('returns the new state', () => {
        expect(reducer(undefined, resultsErrored(error))).to.deep.equal({
          error: error,
          docs: []
        });
      });
    });
  });

  describe('#execute', () => {
    let aggregateStub;
    let cursorStub;
    let state;
    let cursor;

    context('when the pipeline errors', () => {
      const namespace = 'compass-aggregations.test';
      const error = new Error('errored');

      beforeEach(() => {
        aggregateStub = sinon.stub();
        state = {
          namespace: namespace,
          dataService: {
            dataService: {
              aggregate: aggregateStub
            }
          }
        };

        aggregateStub.withArgs(namespace, [], OPTIONS).yields(error, null);
      });

      it('yields the error in the callback', (done) => {
        execute(state, (err) => {
          expect(err).to.deep.equal(error);
          done();
        });
      });
    });

    context('when the pipeline does not error', () => {
      const namespace = 'compass-aggregations.test';
      const documents = [{ name: 'Aphex Twin' }];

      beforeEach(() => {
        aggregateStub = sinon.stub();
        cursorStub = sinon.stub();
        state = {
          namespace: namespace,
          dataService: {
            dataService: {
              aggregate: aggregateStub
            }
          }
        };
        cursor = {
          toArray: cursorStub
        };

        aggregateStub.withArgs(namespace, [], OPTIONS).yields(null, cursor);
        cursorStub.yields(null, documents);
      });

      it('yields the docs in the callback', (done) => {
        execute(state, (err, docs) => {
          expect(err).to.equal(null);
          expect(docs).to.equal(documents);
          done();
        });
      });
    });
  });
});

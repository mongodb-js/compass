import reducer, {
  QUERY_ERROR,
  COPY_QUERY,
  CLEAR_COPY,
  queryError,
  copyQuery,
  clearCopy,
  runQuery
} from 'modules/export-query';

describe('export query module', () => {
  describe('#copyQuery', () => {
    it('returns a copy query action type', () => {
      expect(copyQuery('test query to copy')).to.deep.equal({
        type: COPY_QUERY,
        input: 'test query to copy'
      });
    });
  });

  describe('#queryError', () => {
    it('returns a query error action type', () => {
      expect(queryError('could not find [')).to.deep.equal({
        type: QUERY_ERROR,
        error: 'could not find ['
      });
    });
  });

  describe('#clearCopy', () => {
    it('returns a clear copy action type', () => {
      expect(clearCopy('type')).to.deep.equal({
        type: CLEAR_COPY,
        input: 'type'
      });
    });
  });

  describe('#runQuery', () => {
    it('returns state with return query', () => {
      expect(runQuery('csharp', '{x, 1}')).to.be.a('function');
    });
  });

  describe('#reducer', () => {
    context('action type is query error', () => {
      it('query error is has a value in state', () => {
        expect(reducer(undefined, queryError('uh oh'))).to.deep.equal({
          copyError: null,
          copySuccess: '',
          queryError: 'uh oh',
          returnQuery: ''
        });
      });
    });

    context('action type is clear copy', () => {
      it('returns a clear copy state', () => {
        expect(reducer(undefined, clearCopy('uh oh'))).to.deep.equal({
          copyError: '',
          copySuccess: '',
          queryError: null,
          returnQuery: ''
        });
      });
    });

    context('an empty action type returns an intial state', () => {
      it('empty initial state comes back', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          copyError: null,
          copySuccess: '',
          queryError: null,
          returnQuery: ''
        });
      });
    });
  });
});

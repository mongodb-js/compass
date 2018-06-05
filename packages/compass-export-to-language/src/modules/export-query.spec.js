import reducer, {
  ADD_INPUT_QUERY,
  QUERY_ERROR,
  COPY_QUERY,
  CLEAR_COPY,
  addInputQuery,
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

  describe('#addInputQuery', () => {
    it('returns a add inputq query input type', () => {
      expect(addInputQuery('{ "item": "happy socks", "quantity": 2 }')).to.deep.equal({
        type: ADD_INPUT_QUERY,
        input: '{ "item": "happy socks", "quantity": 2 }'
      });
    });
  });

  describe('#runQuery', () => {
    it('returns state with return query', () => {
      expect(runQuery('csharp', '{x, 1}')).to.be.a('function');
    });
  });

  describe('#reducer', () => {
    context('action type is queryError', () => {
      it('query error is has a value in state', () => {
        expect(reducer(undefined, queryError('uh oh'))).to.deep.equal({
          copyError: null,
          copySuccess: '',
          inputQuery: '',
          queryError: 'uh oh',
          returnQuery: ''
        });
      });
    });

    context('action type is addInputQuery', () => {
      it('inputQuery has a value in state', () => {
        expect(reducer(undefined, addInputQuery('{ "beep": "boop" }'))).to.deep.equal({
          copyError: null,
          copySuccess: '',
          inputQuery: '{ "beep": "boop" }',
          queryError: null,
          returnQuery: ''
        });
      });
    });

    context('action type is clearCopy', () => {
      it('returns a clearCopy state', () => {
        expect(reducer(undefined, clearCopy('uh oh'))).to.deep.equal({
          copyError: '',
          copySuccess: '',
          inputQuery: '',
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
          inputQuery: '',
          queryError: null,
          returnQuery: ''
        });
      });
    });
  });
});

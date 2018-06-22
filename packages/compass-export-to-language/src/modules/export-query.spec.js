import reducer, {
  ADD_INPUT_QUERY,
  INCLUDE_IMPORTS,
  SET_NAMESPACE,
  OUTPUT_LANG,
  QUERY_ERROR,
  TOGLE_MODAL,
  COPY_QUERY,
  CLEAR_COPY,
  includeImports,
  setOutputLang,
  addInputQuery,
  setNamespace,
  togleModal,
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

  describe('#togleModal', () => {
    it('returns a togle modal action type', () => {
      expect(togleModal(true)).to.deep.equal({
        type: TOGLE_MODAL,
        open: true
      });
    });
  });

  describe('#clearCopy', () => {
    it('returns a clear copy action type', () => {
      expect(clearCopy()).to.deep.equal({
        type: CLEAR_COPY
      });
    });
  });

  describe('#setNamespace', () => {
    it('returns a namespace type event', () => {
      expect(setNamespace('Pipeline')).to.deep.equal({
        type: SET_NAMESPACE,
        namespace: 'Pipeline'
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

  describe('#setOutputLang', () => {
    it('returns an outputLang action type', () => {
      expect(setOutputLang('csharp')).to.deep.equal({
        type: OUTPUT_LANG,
        lang: 'csharp'
      });
    });
  });

  describe('#includeImports', () => {
    it('returns an includeImports action type', () => {
      expect(includeImports(true)).to.deep.equal({
        type: INCLUDE_IMPORTS,
        imports: true
      });
    });
  });

  describe('#reducer', () => {
    context('action type is queryError', () => {
      it('query error is has a value in state', () => {
        expect(reducer(undefined, queryError('uh oh'))).to.deep.equal({
          outputLang: 'python',
          queryError: 'uh oh',
          namespace: 'Query',
          copySuccess: false,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('action type is includeImports', () => {
      it('imports true includes imports in state', () => {
        expect(reducer(undefined, includeImports(true))).to.deep.equal({
          outputLang: 'python',
          namespace: 'Query',
          copySuccess: false,
          queryError: null,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: 'from bson import *\nimport datetime\n'
        });
      });

      it('imports false returns empty imports in state', () => {
        expect(reducer(undefined, includeImports(false))).to.deep.equal({
          outputLang: 'python',
          namespace: 'Query',
          copySuccess: false,
          queryError: null,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('action type is addInputQuery', () => {
      it('inputQuery has a value in state', () => {
        expect(reducer(undefined, addInputQuery('{ "beep": "boop" }'))).to.deep.equal({
          inputQuery: '{ "beep": "boop" }',
          outputLang: 'python',
          copySuccess: false,
          namespace: 'Query',
          modalOpen: false,
          queryError: null,
          returnQuery: '',
          imports: ''
        });
      });
    });

    context('action type is setOutputLang', () => {
      it('inputQuery has a value in state', () => {
        expect(reducer(undefined, setOutputLang('csharp'))).to.deep.equal({
          outputLang: 'csharp',
          copySuccess: false,
          namespace: 'Query',
          modalOpen: false,
          queryError: null,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('action type is togleModal', () => {
      it('modalOpen is true in state', () => {
        expect(reducer(undefined, togleModal(true))).to.deep.equal({
          outputLang: 'python',
          copySuccess: false,
          namespace: 'Query',
          queryError: null,
          modalOpen: true,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('action type is togleModal', () => {
      it('modalOpen is false in state', () => {
        expect(reducer(undefined, togleModal(false))).to.deep.equal({
          outputLang: 'python',
          copySuccess: false,
          namespace: 'Query',
          modalOpen: false,
          queryError: null,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('action type is clearCopy', () => {
      it('returns a clearCopy state', () => {
        expect(reducer(undefined, clearCopy())).to.deep.equal({
          outputLang: 'python',
          copySuccess: false,
          namespace: 'Query',
          queryError: null,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('action type is setNamespace', () => {
      it('returns a namespace in state', () => {
        expect(reducer(undefined, setNamespace('Pipeline'))).to.deep.equal({
          namespace: 'Pipeline',
          outputLang: 'python',
          copySuccess: false,
          queryError: null,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });

    context('an empty action type returns an intial state', () => {
      it('empty initial state comes back', () => {
        expect(reducer(undefined, {})).to.deep.equal({
          outputLang: 'python',
          copySuccess: false,
          namespace: 'Query',
          queryError: null,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: ''
        });
      });
    });
  });
});

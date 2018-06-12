import store from 'stores';

describe('ExportToLanguage Store', () => {
  describe('initial store state', () => {
    expect(store.getState()).to.deep.equal({
      exportQuery: {
        namespace: 'Query',
        copySuccess: false,
        queryError: null,
        modalOpen: false,
        returnQuery: '',
        outputLang: '',
        inputQuery: ''
      }
    });
  });
});

import store from 'stores';

describe('ExportToLanguage Store', () => {
  describe('initial store state', () => {
    expect(store.getState()).to.deep.equal({
      exportQuery: {
        queryError: null,
        copySuccess: '',
        returnQuery: '',
        inputQuery: '',
        copyError: null
      }
    });
  });
});

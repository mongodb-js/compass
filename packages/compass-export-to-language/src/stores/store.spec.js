import store from 'stores';

describe('ExportToLanguage Store', () => {
  describe('initial store state', () => {
    expect(store.getState()).to.deep.equal({
      exportQuery: {
        copySuccess: '',
        returnQuery: '',
        queryError: null,
        copyError: null
      }
    });
  });
});

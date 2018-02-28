import reducer, * as actions from 'modules/import';

describe('import [module]', () => {
  describe('#reducer', () => {
    context('when the action type is IMPORT_PROGRESS', () => {
      const action = actions.importProgress(55);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 55,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is SELECT_IMPORT_FILE_TYPE', () => {
      const action = actions.selectImportFileType('csv');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'csv',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is SELECT_IMPORT_FILE_NAME', () => {
      const action = actions.selectImportFileName('test.json');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          error: null,
          fileName: 'test.json',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is OPEN_IMPORT', () => {
      const action = actions.openImport();

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: true,
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is CLOSE_IMPORT', () => {
      const action = actions.closeImport();

      it('returns the new state', () => {
        expect(reducer({}, action)).to.deep.equal({ isOpen: false });
      });
    });

    context('when the action type is IMPORT_FAILED', () => {
      const error = new Error('failed');
      const action = actions.importFailed(error);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 100,
          error: error,
          fileName: '',
          fileType: 'json',
          status: 'FAILED'
        });
      });
    });

    context('when the action type is not defined', () => {
      it('returns the initial state', () => {
        expect(reducer('', {})).to.equal('');
      });
    });
  });

  describe('#openImport', () => {
    it('returns the action', () => {
      expect(actions.openImport()).to.deep.equal({
        type: actions.OPEN_IMPORT
      });
    });
  });

  describe('#closeImport', () => {
    it('returns the action', () => {
      expect(actions.closeImport()).to.deep.equal({
        type: actions.CLOSE_IMPORT
      });
    });
  });

  describe('#importFailed', () => {
    const error = new Error('failed');

    it('returns the action', () => {
      expect(actions.importFailed(error)).to.deep.equal({
        type: actions.IMPORT_FAILED,
        error: error
      });
    });
  });

  describe('#importProgress', () => {
    it('returns the action', () => {
      expect(actions.importProgress(34)).to.deep.equal({
        type: actions.IMPORT_PROGRESS,
        progress: 34
      });
    });
  });

  describe('#selectImportFileName', () => {
    it('returns the action', () => {
      expect(actions.selectImportFileName('test.json')).to.deep.equal({
        type: actions.SELECT_IMPORT_FILE_NAME,
        fileName: 'test.json'
      });
    });
  });

  describe('#selectImportFileType', () => {
    it('returns the action', () => {
      expect(actions.selectImportFileType('csv')).to.deep.equal({
        type: actions.SELECT_IMPORT_FILE_TYPE,
        fileType: 'csv'
      });
    });
  });
});

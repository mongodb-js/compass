import reducer, * as actions from 'modules/export';

describe('export [module]', () => {
  describe('#reducer', () => {
    context('when the action type is EXPORT_PROGRESS', () => {
      const action = actions.exportProgress(55);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 55,
          isFullCollection: false,
          query: { filter: {}},
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is EXPORT_FAILED', () => {
      const error = new Error('testing');
      const action = actions.exportFailed(error);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 100,
          isFullCollection: false,
          query: { filter: {}},
          error: error,
          fileName: '',
          fileType: 'json',
          status: 'FAILED'
        });
      });
    });

    context('when the action type is SELECT_EXPORT_FILE_TYPE', () => {
      const action = actions.selectExportFileType('csv');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          isFullCollection: false,
          query: { filter: {}},
          error: null,
          fileName: '',
          fileType: 'csv',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is SELECT_EXPORT_FILE_NAME', () => {
      const action = actions.selectExportFileName('testing.json');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          isFullCollection: false,
          query: { filter: {}},
          error: null,
          fileName: 'testing.json',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is OPEN_EXPORT', () => {
      const action = actions.openExport();

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: true,
          progress: 0,
          isFullCollection: false,
          query: { filter: {}},
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is CLOSE_EXPORT', () => {
      const action = actions.closeExport();

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          isFullCollection: false,
          query: { filter: {}},
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is not defined', () => {
      it('returns the initial state', () => {
        expect(reducer('', {})).to.equal('');
      });
    });
  });

  describe('#closeExport', () => {
    it('returns the action', () => {
      expect(actions.closeExport()).to.deep.equal({
        type: actions.CLOSE_EXPORT
      });
    });
  });

  describe('#openExport', () => {
    it('returns the action', () => {
      expect(actions.openExport()).to.deep.equal({
        type: actions.OPEN_EXPORT
      });
    });
  });

  describe('#exportFailed', () => {
    const error = new Error('failed');

    it('returns the action', () => {
      expect(actions.exportFailed(error)).to.deep.equal({
        type: actions.EXPORT_FAILED,
        error: error
      });
    });
  });

  describe('#exportProgress', () => {
    it('returns the action', () => {
      expect(actions.exportProgress(66)).to.deep.equal({
        type: actions.EXPORT_PROGRESS,
        progress: 66
      });
    });
  });

  describe('#selectExportFileName', () => {
    it('returns the action', () => {
      expect(actions.selectExportFileName('testing.json')).to.deep.equal({
        type: actions.SELECT_EXPORT_FILE_NAME,
        fileName: 'testing.json'
      });
    });
  });

  describe('#selectExportFileType', () => {
    it('returns the action', () => {
      expect(actions.selectExportFileType('csv')).to.deep.equal({
        type: actions.SELECT_EXPORT_FILE_TYPE,
        fileType: 'csv'
      });
    });
  });

  describe('#exportAction', () => {
    it('returns the action', () => {
      expect(actions.exportAction('STARTED')).to.deep.equal({
        type: actions.EXPORT_ACTION,
        status: 'STARTED'
      });
    });
  });
});

import reducer, * as actions from './export';
import PROCESS_STATUS from 'constants/process-status';
import EXPORT_STEP from 'constants/export-step';
import FILE_TYPES from 'constants/file-types';

describe.skip('export [module]', () => {
  describe('#reducer', () => {
    context('when the action type is FINISHED', () => {
      context('when the state has an error', () => {
        const action = actions.onFinished();

        it('returns the new state and stays open', () => {
          expect(reducer({ error: true, isOpen: false }, action)).to.deep.equal({
            isOpen: true,
            progress: 100,
            exportStep: EXPORT_STEP.QUERY,
            isFullCollection: false,
            query: { filter: {} },
            error: true,
            fields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.UNSPECIFIED,
            exportedDocsCount: 0,
            count: 0
          });
        });
      });

      context('when the state has no error', () => {
        const action = actions.onFinished();

        it('returns the new state and closes', () => {
          expect(reducer({ isOpen: true }, action)).to.deep.equal({
            isOpen: false,
            progress: 100,
            status: undefined
          });
        });
      });

      context('when the status is started', () => {
        const action = actions.onFinished();

        it('sets the status to completed', () => {
          expect(reducer({ status: PROCESS_STATUS.STARTED }, action)).to.deep.equal({
            isOpen: false,
            progress: 100,
            status: PROCESS_STATUS.COMPLETED
          });
        });
      });

      context('when the status is canceled', () => {
        const action = actions.onFinished();

        it('keeps the same status', () => {
          expect(reducer({ status: PROCESS_STATUS.CANCELED }, action)).to.deep.equal({
            isOpen: true,
            progress: 100,
            status: PROCESS_STATUS.CANCELED
          });
        });
      });

      context('when the status is failed', () => {
        const action = actions.onFinished();

        it('keeps the same status', () => {
          expect(reducer({ status: PROCESS_STATUS.FAILED }, action)).to.deep.equal({
            isOpen: true,
            progress: 100,
            status: PROCESS_STATUS.FAILED
          });
        });
      });
    });

    context('when the action type is PROGRESS', () => {
      const action = actions.onProgress(55);

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

    context('when the action type is FAILED', () => {
      const error = new Error('testing');
      const action = actions.onError(error);

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

    context('when the action type is SELECT_FILE_TYPE', () => {
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

    context('when the action type is SELECT_FILE_NAME', () => {
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

    context('when the action type is OPEN', () => {
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

    context('when the action type is CHANGE_EXPORT_STEP', () => {
      const action = actions.changeExportStep(EXPORT_STEP.QUERY);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          progress: 0,
          count: 0,
          exportedDocsCount: 0,
          exportStep: EXPORT_STEP.QUERY,
          isFullCollection: false,
          fields: {},
          query: { filter: {}},
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is UPDATE_FIELDS', () => {
      const fields = { 'field': 1, 'field2': 0 };
      const action = actions.updateFields(fields);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          count: 0,
          exportedDocsCount: 0,
          exportStep: EXPORT_STEP.QUERY,
          isFullCollection: false,
          query: { filter: {}},
          fields: fields,
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

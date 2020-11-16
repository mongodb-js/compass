import PROCESS_STATUS from 'constants/process-status';
import EXPORT_STEP from 'constants/export-step';
import AppRegistry from 'hadron-app-registry';
import FILE_TYPES from 'constants/file-types';
import reducer, * as actions from './export';
import configureStore from 'stores';

describe('export [module]', () => {
  describe('#reducer', () => {
    context('when the action type is FINISHED', () => {
      let store;
      const localAppRegistry = new AppRegistry();
      const globalAppRegistry = new AppRegistry();

      beforeEach(() => {
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });

      context('when the state has an error', () => {
        it('returns the new state and stays open', () => {
          store.dispatch(actions.onModalOpen(200, { filter: {} }));
          store.dispatch(actions.onError(true));
          store.dispatch(actions.onFinished(10));
          expect(store.getState().exportData).to.deep.equal({
            isOpen: true,
            dest: undefined,
            source: undefined,
            exportedDocsCount: 10,
            progress: 0,
            exportStep: EXPORT_STEP.QUERY,
            isFullCollection: false,
            query: { filter: {} },
            error: true,
            fields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.FAILED,
            count: 200
          });
        });
      });

      context('when the state has no error', () => {
        it('returns the new state and closes', () => {
          store.dispatch(actions.onModalOpen(200, { filter: {} }));
          store.dispatch(actions.onFinished(10));
          store.dispatch(actions.closeExport());
          expect(store.getState().exportData).to.deep.equal({
            isOpen: false,
            dest: undefined,
            source: undefined,
            exportedDocsCount: 10,
            progress: 0,
            exportStep: EXPORT_STEP.QUERY,
            isFullCollection: false,
            query: { filter: {} },
            error: null,
            fields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.COMPLETED,
            count: 200
          });
        });
      });

      context('when the status is canceled', () => {
        it('keeps the same status', () => {
          store.dispatch(actions.onModalOpen(200, { filter: {} }));
          store.getState().exportData.status = PROCESS_STATUS.CANCELED;
          store.dispatch(actions.onFinished(10));
          expect(store.getState().exportData).to.deep.equal({
            isOpen: true,
            dest: undefined,
            source: undefined,
            exportedDocsCount: 10,
            progress: 0,
            exportStep: EXPORT_STEP.QUERY,
            isFullCollection: false,
            query: { filter: {} },
            error: null,
            fields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.CANCELED,
            count: 200
          });
        });
      });

      context('when the status is failed', () => {
        it('keeps the same status', () => {
          store.dispatch(actions.onModalOpen(200, { filter: {} }));
          store.dispatch(actions.onError(true));
          store.dispatch(actions.onFinished(10));
          expect(store.getState().exportData).to.deep.equal({
            isOpen: true,
            dest: undefined,
            source: undefined,
            exportedDocsCount: 10,
            progress: 0,
            exportStep: EXPORT_STEP.QUERY,
            isFullCollection: false,
            query: { filter: {} },
            error: true,
            fields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.FAILED,
            count: 200
          });
        });
      });
    });

    context('when the action type is PROGRESS', () => {
      let store;
      const localAppRegistry = new AppRegistry();
      const globalAppRegistry = new AppRegistry();

      beforeEach(() => {
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });

      it('returns the new state', () => {
        store.dispatch(actions.onModalOpen(200, { filter: {} }));
        store.dispatch(actions.onProgress(0.7, 100));
        expect(store.getState().exportData).to.deep.equal({
          isOpen: true,
          exportedDocsCount: 100,
          progress: 0.7,
          exportStep: EXPORT_STEP.QUERY,
          isFullCollection: false,
          query: { filter: {} },
          error: null,
          fields: {},
          fileName: '',
          fileType: FILE_TYPES.JSON,
          status: PROCESS_STATUS.UNSPECIFIED,
          count: 200
        });
      });
    });

    context('when the action type is SELECT_FILE_TYPE', () => {
      const action = actions.selectExportFileType('csv');

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          count: 0,
          exportStep: EXPORT_STEP.QUERY,
          exportedDocsCount: 0,
          fields: {},
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
          count: 0,
          source: undefined,
          dest: undefined,
          exportStep: EXPORT_STEP.QUERY,
          exportedDocsCount: 0,
          fields: {},
          isFullCollection: false,
          query: { filter: {}},
          error: null,
          fileName: 'testing.json',
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
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is CLOSE_EXPORT', () => {
      let store;
      const localAppRegistry = new AppRegistry();
      const globalAppRegistry = new AppRegistry();

      beforeEach(() => {
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry
        });
      });

      it('returns the new state', () => {
        store.dispatch(actions.closeExport());
        expect(store.getState().exportData).to.deep.equal({
          isOpen: false,
          exportedDocsCount: 0,
          progress: 0,
          exportStep: EXPORT_STEP.QUERY,
          isFullCollection: false,
          query: { filter: {} },
          error: null,
          fields: {},
          fileName: '',
          fileType: FILE_TYPES.JSON,
          status: PROCESS_STATUS.UNSPECIFIED,
          count: 0
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
        type: actions.CLOSE
      });
    });
  });

  describe('#onModalOpen', () => {
    it('returns the action', () => {
      expect(actions.onModalOpen(100, { filter: {} })).to.deep.equal({
        type: actions.ON_MODAL_OPEN,
        count: 100,
        query: { filter: {} }
      });
    });
  });

  describe('#onError', () => {
    const error = new Error('failed');

    it('returns the action', () => {
      expect(actions.onError(error)).to.deep.equal({
        type: actions.ERROR,
        error: error
      });
    });
  });

  describe('#onProgress', () => {
    it('returns the action', () => {
      expect(actions.onProgress(0.33, 66)).to.deep.equal({
        type: actions.PROGRESS,
        progress: 0.33,
        exportedDocsCount: 66
      });
    });
  });

  describe('#selectExportFileName', () => {
    it('returns the action', () => {
      expect(actions.selectExportFileName('testing.json')).to.deep.equal({
        type: actions.SELECT_FILE_NAME,
        fileName: 'testing.json'
      });
    });
  });

  describe('#selectExportFileType', () => {
    it('returns the action', () => {
      expect(actions.selectExportFileType('csv')).to.deep.equal({
        type: actions.SELECT_FILE_TYPE,
        fileType: 'csv'
      });
    });
  });

  describe('#changeExportStep', () => {
    it('returns the action', () => {
      expect(actions.changeExportStep('STARTED')).to.deep.equal({
        type: actions.CHANGE_EXPORT_STEP,
        status: 'STARTED'
      });
    });
  });
});

import path from 'path';
import os from 'os';
import fs from 'fs';
import PROCESS_STATUS from '../constants/process-status';
import EXPORT_STEP from '../constants/export-step';
import AppRegistry from 'hadron-app-registry';
import FILE_TYPES from '../constants/file-types';
import reducer, * as actions from './export';
import store from '../stores/export-store';
import { DataService } from 'mongodb-data-service';
import { promisify } from 'util';
import { once } from 'events';
import { dataServiceConnected, globalAppRegistryActivated } from './compass';
describe('export [module]', () => {
  beforeEach(() => {
    store.dispatch(actions.reset());
  });

  describe('#reducer', () => {
    context('#startExport', () => {
      const globalAppRegistry = new AppRegistry();
      const dataService = new DataService({ connectionString: 'mongodb://localhost:27018/local'});
      const createCollection = promisify(dataService.createCollection).bind(dataService);
      const dropCollection = promisify(dataService.dropCollection).bind(dataService);
      const insertMany = promisify(dataService.insertMany).bind(dataService);
      const TEST_COLLECTION_NAME = 'local.foobar';

      afterEach(async function() {
        await dropCollection(TEST_COLLECTION_NAME);
      });

      beforeEach(async function() {
        await dataService.connect();

        await createCollection(TEST_COLLECTION_NAME);
        await insertMany(TEST_COLLECTION_NAME, [
          {
            _id: 'foo',
            first_name: 'John',
            last_name: 'Appleseed'
          }
        ]);

        store.dispatch(dataServiceConnected(null, dataService));
        store.dispatch(globalAppRegistryActivated(globalAppRegistry));

        // Manually awaiting a thunk to make sure that store is ready for the
        // tests
        await actions.openExport({
          namespace: TEST_COLLECTION_NAME,
          query: {},
          count: 0,
        })(store.dispatch, store.getState);
      });

      async function configureAndStartExport(selectedFields, fileType, tempFile) {
        store.dispatch(actions.updateSelectedFields(selectedFields));
        store.dispatch(actions.selectExportFileName(tempFile));
        store.dispatch(actions.selectExportFileType(fileType));
        store.dispatch(actions.toggleFullCollection());
        store.dispatch(actions.startExport());
        await once(globalAppRegistry, 'export-finished');
        const writtenData = fs.readFileSync(tempFile, 'utf-8');
        return writtenData;
      }

      describe('CSV Export', () => {
        let tempFile;
        beforeEach(() => {
          tempFile = path.join(
            os.tmpdir(),
            `test-${Date.now()}.csv`
          );
        });
        afterEach(() => {
          fs.unlinkSync(tempFile);
        });
        it('should set the correct fields to CSV export', async() => {
          const fields = { 'first_name': 1, 'foobar': 1, 'last_name': 0};
          const data = await configureAndStartExport(fields, 'csv', tempFile);
          const writtenData = data.split('\n');
          expect(writtenData[0]).to.equal('first_name,foobar');
          expect(writtenData[1]).to.equal('John,');
        });
        it('should not include _id if not specified', async() => {
          const fields = { 'first_name': 1, 'foobar': 1 };
          const data = await configureAndStartExport(fields, 'csv', tempFile);
          const writtenData = data.split('\n');
          expect(writtenData[0]).to.equal('first_name,foobar');
          expect(writtenData[1]).to.equal('John,');
        });
      });
      describe('JSON Export', () => {
        let tempFile;
        beforeEach(() => {
          tempFile = path.join(
            os.tmpdir(),
            `test-${Date.now()}.json`
          );
        });
        afterEach(() => {
          fs.unlinkSync(tempFile);
        });
        it('should not include _id if omitted', async() => {
          const fields = { 'first_name': 1, 'last_name': 0 };
          const data = await configureAndStartExport(fields, 'json', tempFile);
          const writtenData = JSON.parse(data);
          expect(writtenData).to.deep.equal([
            {
              first_name: 'John',
            }
          ]);
        });

        it('should not include _id if is set to 0', async() => {
          const fields = { 'first_name': 1, 'last_name': 0, _id: 0 };
          const data = await configureAndStartExport(fields, 'json', tempFile);
          const writtenData = JSON.parse(data);
          expect(writtenData).to.deep.equal([
            {
              first_name: 'John',
            }
          ]);
        });

        it('should include _id if is set to 1', async() => {
          const fields = { 'first_name': 1, 'last_name': 0, _id: 1 };
          const data = await configureAndStartExport(fields, 'json', tempFile);
          const writtenData = JSON.parse(data);
          expect(writtenData).to.deep.equal([
            {
              _id: 'foo',
              first_name: 'John',
            }
          ]);
        });

        it('should include all fields if projection is empty', async() => {
          const fields = {};
          const data = await configureAndStartExport(fields, 'json', tempFile);
          const writtenData = JSON.parse(data);
          expect(writtenData).to.deep.equal([
            {
              _id: 'foo',
              first_name: 'John',
              last_name: 'Appleseed'
            }
          ]);
        });
        it('should include all fields all fields are set to 0', async() => {
          const fields = { first_name: 0, last_name: 0, _id: 0};
          const data = await configureAndStartExport(fields, 'json', tempFile);
          const writtenData = JSON.parse(data);
          expect(writtenData).to.deep.equal([
            {
              _id: 'foo',
              first_name: 'John',
              last_name: 'Appleseed'
            }
          ]);
        });
      });
    });
    context('when the action type is FINISHED', () => {
      context('when the state has an error', () => {
        it('returns the new state and stays open', () => {
          store.dispatch(
            actions.onModalOpen({
              namespace: 'test',
              count: 200,
              query: { filter: {} },
            })
          );
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
            allFields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.FAILED,
            count: 200,
          });
        });
      });

      context('when the state has no error', () => {
        it('returns the new state and closes', () => {
          store.dispatch(
            actions.onModalOpen({
              namespace: 'test',
              count: 200,
              query: { filter: {} },
            })
          );
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
            allFields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.COMPLETED,
            count: 200,
          });
        });
      });

      context('when the status is canceled', () => {
        it('keeps the same status', () => {
          store.dispatch(
            actions.onModalOpen({
              namespace: 'test',
              count: 200,
              query: { filter: {} },
            })
          );
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
            allFields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.CANCELED,
            count: 200,
          });
        });
      });

      context('when the status is failed', () => {
        it('keeps the same status', () => {
          store.dispatch(
            actions.onModalOpen({
              namespace: 'test',
              count: 200,
              query: { filter: {} },
            })
          );
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
            allFields: {},
            fileName: '',
            fileType: FILE_TYPES.JSON,
            status: PROCESS_STATUS.FAILED,
            count: 200,
          });
        });
      });
    });

    context('when the action type is PROGRESS', () => {
      it('returns the new state', () => {
        store.dispatch(
          actions.onModalOpen({
            namespace: 'test',
            count: 200,
            query: { filter: {} },
          })
        );
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
          allFields: {},
          fileName: '',
          fileType: FILE_TYPES.JSON,
          status: PROCESS_STATUS.UNSPECIFIED,
          count: 200,
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
          allFields: {},
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
          allFields: {},
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
          allFields: {},
          query: { filter: {}},
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is UPDATE_SELECTED_FIELDS', () => {
      const fields = { 'field': 1, 'field2': 0 };
      const action = actions.updateSelectedFields(fields);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          count: 0,
          exportedDocsCount: 0,
          exportStep: EXPORT_STEP.QUERY,
          isFullCollection: false,
          query: { filter: {}},
          fields: fields,
          allFields: {},
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is UPDATE_ALL_FIELDS', () => {
      const fields = { 'field': 1, 'field2': 0 };
      const action = actions.updateAllFields(fields);

      it('returns the new state', () => {
        expect(reducer(undefined, action)).to.deep.equal({
          isOpen: false,
          count: 0,
          exportedDocsCount: 0,
          exportStep: EXPORT_STEP.QUERY,
          isFullCollection: false,
          query: { filter: {}},
          fields: {},
          allFields: fields,
          progress: 0,
          error: null,
          fileName: '',
          fileType: 'json',
          status: 'UNSPECIFIED'
        });
      });
    });

    context('when the action type is CLOSE_EXPORT', () => {
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
          allFields: {},
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
      expect(
        actions.onModalOpen({
          namespace: 'test',
          count: 100,
          query: { filter: {} },
        })
      ).to.deep.equal({
        type: actions.ON_MODAL_OPEN,
        namespace: 'test',
        count: 100,
        query: { filter: {} },
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

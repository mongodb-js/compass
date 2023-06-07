import os from 'os';
import { expect } from 'chai';
import { createStore, applyMiddleware } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import type { AnyAction } from 'redux';
import thunk from 'redux-thunk';
import temp from 'temp';
import fs from 'fs';
import path from 'path';
import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';
import AppRegistry from 'hadron-app-registry';
import { once } from 'events';

temp.track();

import {
  openExport,
  initialState,
  rootExportReducer,
  addFieldToExport,
  toggleExportAllSelectedFields,
  toggleFieldToExport,
  selectFieldsToExport,
  ExportActionTypes,
  cancelExport,
  closeExport,
  runExport,
} from './export';
import type { RootState } from './export';
import { dataServiceConnected, globalAppRegistryActivated } from './compass';

type DispatchFunctionType = ThunkDispatch<RootState, void, AnyAction>;

const mockEmptyState = {
  export: {
    ...initialState,
  },
};

describe('export [module]', function () {
  // This is re-created in the `beforeEach`, it's useful for typing to have it here as well.
  let testStore = createStore(
    rootExportReducer,
    mockEmptyState,
    applyMiddleware<DispatchFunctionType, RootState>(thunk)
  );
  beforeEach(function () {
    const mockState = {
      export: {
        ...initialState,
      },
    };
    testStore = createStore(
      rootExportReducer,
      mockState,
      applyMiddleware<DispatchFunctionType, RootState>(thunk)
    );
  });

  describe('#openExport', function () {
    it('sets isInProgressMessageOpen to true when export is in progress and does not open', function () {
      // TODO(COMPASS-6580)
    });

    it('opens and sets the namespace', function () {
      const testNS = 'test.123';
      expect(testStore.getState().export.status).to.equal(undefined);
      expect(testStore.getState().export.namespace).to.not.equal(testNS);
      expect(testStore.getState().export.isInProgressMessageOpen).to.equal(
        false
      );
      expect(testStore.getState().export.isOpen).to.equal(false);
      expect(testStore.getState().export.exportFullCollection).to.equal(
        undefined
      );

      testStore.dispatch(
        openExport({
          namespace: 'test.123',
          query: {
            filter: {},
          },
          origin: 'crud-toolbar',
          exportFullCollection: true,
        })
      );

      expect(testStore.getState().export.namespace).to.equal(testNS);
      expect(testStore.getState().export.isInProgressMessageOpen).to.equal(
        false
      );
      expect(testStore.getState().export.isOpen).to.equal(true);
      expect(testStore.getState().export.exportFullCollection).to.equal(true);
    });
  });

  describe('#addFieldToExport', function () {
    it('adds the field to the fields to export', function () {
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({});

      testStore.dispatch(addFieldToExport(['one', 'two']));

      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
      });
    });
  });

  describe('#toggleFieldToExport', function () {
    it('toggles the field to export', function () {
      testStore.dispatch(addFieldToExport(['five']));
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });

      testStore.dispatch(toggleFieldToExport('["five"]'));
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["five"]': {
          path: ['five'],
          selected: false,
        },
      });
      testStore.dispatch(toggleFieldToExport('["five"]'));
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });
    });
  });

  describe('#toggleExportAllSelectedFields', function () {
    it('toggles all of the fields', function () {
      testStore.dispatch(addFieldToExport(['one']));
      testStore.dispatch(toggleFieldToExport('["one"]'));
      testStore.dispatch(addFieldToExport(['one', 'two']));
      testStore.dispatch(addFieldToExport(['five']));

      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: false,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });

      testStore.dispatch(toggleExportAllSelectedFields());
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: true,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });

      testStore.dispatch(toggleExportAllSelectedFields());
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: false,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: false,
        },
        '["five"]': {
          path: ['five'],
          selected: false,
        },
      });

      testStore.dispatch(toggleExportAllSelectedFields());
      expect(testStore.getState().export.fieldsToExport).to.deep.equal({
        '["one"]': {
          path: ['one'],
          selected: true,
        },
        '["one","two"]': {
          path: ['one', 'two'],
          selected: true,
        },
        '["five"]': {
          path: ['five'],
          selected: true,
        },
      });
    });
  });

  describe('#selectFieldsToExport', function () {
    it('sets errors on the store', async function () {
      expect(testStore.getState().export.errorLoadingFieldsToExport).to.equal(
        undefined
      );

      await testStore.dispatch(selectFieldsToExport());

      expect(
        testStore.getState().export.errorLoadingFieldsToExport
      ).to.not.equal(undefined);
    });
  });

  describe('#closeExport', function () {
    it('signals an abort on the export abort controller', function () {
      const testAbortController = new AbortController();
      testStore.dispatch({
        type: ExportActionTypes.RunExport,
        exportAbortController: testAbortController,
      });

      expect(testStore.getState().export.exportAbortController).to.equal(
        testAbortController
      );
      expect(
        testStore.getState().export.exportAbortController?.signal.aborted
      ).to.equal(false);
      expect(testAbortController.signal.aborted).to.equal(false);

      testStore.dispatch(closeExport());

      expect(testAbortController.signal.aborted).to.equal(true);
    });

    it('signals an abort on the fetch schema fields abort controller', function () {
      const testAbortController = new AbortController();
      testStore.dispatch({
        type: ExportActionTypes.FetchFieldsToExport,
        fieldsToExportAbortController: testAbortController,
      });

      expect(
        testStore.getState().export.fieldsToExportAbortController
      ).to.equal(testAbortController);
      expect(
        testStore.getState().export.fieldsToExportAbortController?.signal
          .aborted
      ).to.equal(false);
      expect(testAbortController.signal.aborted).to.equal(false);

      testStore.dispatch(closeExport());

      expect(testAbortController.signal.aborted).to.equal(true);
    });
  });

  describe('#cancelExport', function () {
    it('aborts the export', function () {
      const testAbortController = new AbortController();
      testStore.dispatch({
        type: ExportActionTypes.RunExport,
        exportAbortController: testAbortController,
      });

      expect(testStore.getState().export.exportAbortController).to.equal(
        testAbortController
      );
      expect(
        testStore.getState().export.exportAbortController?.signal.aborted
      ).to.equal(false);
      expect(testAbortController.signal.aborted).to.equal(false);

      testStore.dispatch(cancelExport());

      expect(testAbortController.signal.aborted).to.equal(true);
      expect(testStore.getState().export.exportAbortController).to.equal(
        undefined
      );
    });
  });

  describe('#runExport', function () {
    let dataService: DataService;
    let tmpdir: string;
    let appRegistry: AppRegistry;

    const testDB = 'export-runExport-test';
    const testNS = `${testDB}.test-col`;

    beforeEach(async function () {
      tmpdir = path.join(
        os.tmpdir(),
        'compass-export-runExport-test',
        `test-${Date.now()}`
      );
      await fs.promises.mkdir(tmpdir, { recursive: true });

      dataService = await connect({
        connectionOptions: {
          connectionString: 'mongodb://localhost:27019/local',
        },
      });

      try {
        await dataService.dropCollection(testNS);
      } catch (err) {
        // ignore
      }
      await dataService.createCollection(testNS, {});
      await dataService.insertOne(testNS, {
        _id: 2,
        testDoc: true,
      });

      testStore.dispatch(dataServiceConnected(undefined, dataService));

      appRegistry = new AppRegistry();
      testStore.dispatch(globalAppRegistryActivated(appRegistry));
    });

    afterEach(async function () {
      await fs.promises.rm(tmpdir, { recursive: true });

      await dataService.disconnect();
    });

    it('runs an export', async function () {
      testStore.dispatch(
        openExport({
          namespace: testNS,
          query: {
            filter: {},
          },
          origin: 'menu',
          exportFullCollection: true,
        })
      );

      const textExportFilePath = path.join(tmpdir, 'run-export-test.json');
      void testStore.dispatch(
        runExport({
          filePath: textExportFilePath,
          jsonFormatVariant: 'default',
          fileType: 'json',
        })
      );

      await once(appRegistry, 'export-finished');

      let resultText;
      try {
        resultText = await fs.promises.readFile(textExportFilePath, 'utf8');
      } catch (err) {
        console.log(textExportFilePath);
        throw err;
      }

      const expectedText = `[{
  "_id": 2,
  "testDoc": true
}]`;

      expect(resultText).to.equal(expectedText);
    });

    it('runs an aggregation export', async function () {
      testStore.dispatch(
        openExport({
          namespace: testNS,
          origin: 'aggregations-toolbar',
          query: {
            filter: {},
          },
          aggregation: {
            stages: [
              {
                $match: {},
              },
              {
                $project: { _id: 0 },
              },
            ],
          },
        })
      );

      const textExportFilePath = path.join(tmpdir, 'run-export-test-2.json');
      void testStore.dispatch(
        runExport({
          filePath: textExportFilePath,
          jsonFormatVariant: 'default',
          fileType: 'json',
        })
      );

      await once(appRegistry, 'export-finished');

      let resultText;
      try {
        resultText = await fs.promises.readFile(textExportFilePath, 'utf8');
      } catch (err) {
        console.log(textExportFilePath);
        throw err;
      }

      const expectedText = `[{
  "testDoc": true
}]`;

      expect(resultText).to.equal(expectedText);
    });
  });
});

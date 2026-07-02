import React from 'react';
import { expect } from 'chai';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { Provider } from 'react-redux';
import AppRegistry, {
  createActivateHelpers,
} from '@mongodb-js/compass-app-registry';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import { createNoopTrack } from '@mongodb-js/compass-telemetry/provider';
import {
  ConnectionScopedAppRegistryImpl,
  type ConnectionInfoRef,
} from '@mongodb-js/compass-connections/provider';
import type { FieldStoreService } from '@mongodb-js/compass-field-store';
import { createDefaultConnectionInfo } from '@mongodb-js/testing-library-compass';
import InsertDocumentDialog from './insert-document-dialog';
import { setCodemirrorEditorValue } from '@mongodb-js/compass-editor';
import { activateDocumentsPlugin } from '../stores/crud-store';
import { openInsertDocumentDialog } from '../stores/insert';

const TEST_CONNECTION_INFO = createDefaultConnectionInfo();

const mockFieldStoreService = {
  updateFieldsFromDocuments() {},
  updateFieldsFromSchema() {},
  getSchemaFieldsForNamespace() {
    return undefined;
  },
} as unknown as FieldStoreService;

function createActivatedStore(ns = 'airbnb.listings') {
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();
  const connectionInfoRef = {
    current: TEST_CONNECTION_INFO,
  } as ConnectionInfoRef;
  const connectionScopedAppRegistry = new ConnectionScopedAppRegistryImpl(
    globalAppRegistry.emit.bind(globalAppRegistry),
    connectionInfoRef
  );

  return activateDocumentsPlugin(
    {
      namespace: ns,
      isReadonly: false,
      isTimeSeries: false,
      isSearchIndexesSupported: false,
      noRefreshOnConfigure: true,
    },
    {
      dataService: {} as any,
      instance: {
        build: { version: '7.0.0' },
        dataLake: { isDataLake: false },
        isWritable: true,
        description: 'Standalone',
        topologyDescription: { type: 'Standalone' },
        on: () => {},
        removeListener: () => {},
      } as any,
      localAppRegistry,
      globalAppRegistry,
      preferences: {} as any,
      logger: createNoopLogger(),
      track: createNoopTrack(),
      fieldStoreService: mockFieldStoreService,
      connectionInfoRef,
      connectionScopedAppRegistry,
      queryBar: {
        getLastAppliedQuery: () => ({}),
        getCurrentQuery: () => ({}),
        changeQuery: () => {},
      },
      collection: {
        toJSON: () => ({
          avg_document_size: 0,
          document_count: 0,
          free_storage_size: 0,
          storage_size: 0,
        }),
        on: () => {},
        removeListener: () => {},
      } as any,
    },
    createActivateHelpers()
  );
}

describe('InsertDocumentDialog', function () {
  it('show error message for invalid EJSON', async function () {
    const { store, deactivate } = createActivatedStore();
    await store.dispatch(openInsertDocumentDialog({}));

    render(
      <Provider store={store}>
        <InsertDocumentDialog />
      </Provider>
    );

    await setCodemirrorEditorValue(
      screen.getByTestId('insert-document-json-editor'),
      '{ "invalid_long": { "$numberLong": "1234567234324812317654321" } } '
    );

    const errorMessage = await screen.findByText(
      /numberLong string is too long/i
    );
    expect(errorMessage).to.exist;
    deactivate();
  });
});

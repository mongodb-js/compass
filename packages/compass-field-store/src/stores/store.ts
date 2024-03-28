import { createStore } from 'redux';
import reducer, { changeFields } from '../modules';
import type { Schema } from 'mongodb-schema';
import parseSchema from 'mongodb-schema';
import type { AppRegistry, ActivateHelpers } from 'hadron-app-registry';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';
import { FieldStoreContext } from './context';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

export function activatePlugin(
  _initialProps: unknown,
  { globalAppRegistry }: { globalAppRegistry: AppRegistry },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(reducer);

  const emitFieldsChanged = (connectionInfo: ConnectionInfo, ns: string) => {
    const namespacesState = store.getState()[connectionInfo.id] ?? {};
    const fieldsState = namespacesState[ns];
    globalAppRegistry.emit('fields-changed', {
      connectionInfo,
      ns,
      ...fieldsState,
      autocompleteFields: schemaFieldsToAutocompleteItems(fieldsState.fields),
    });
  };

  const onDocumentsChanged = async ({
    connectionInfo,
    ns,
    docs,
  }: {
    connectionInfo: ConnectionInfo;
    ns: string;
    docs: Document[];
  }) => {
    try {
      const { fields } = await parseSchema(docs);
      store.dispatch(changeFields(connectionInfo.id, ns, fields));
      emitFieldsChanged(connectionInfo, ns);
    } catch {
      // ignore errors
    }
  };

  on(globalAppRegistry, 'documents-refreshed', onDocumentsChanged);

  on(globalAppRegistry, 'document-inserted', onDocumentsChanged);

  on(globalAppRegistry, 'documents-paginated', onDocumentsChanged);

  on(
    globalAppRegistry,
    'schema-analyzed',
    ({
      connectionInfo,
      ns,
      schema,
    }: {
      connectionInfo: ConnectionInfo;
      ns: string;
      schema: Schema;
    }) => {
      store.dispatch(changeFields(connectionInfo.id, ns, schema.fields));
      emitFieldsChanged(connectionInfo, ns);
    }
  );

  return { store, deactivate: cleanup, context: FieldStoreContext };
}

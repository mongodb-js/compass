import { createStore } from 'redux';
import reducer, { changeFields } from '../modules';
import type { Schema } from 'mongodb-schema';
import parseSchema from 'mongodb-schema';
import type { AppRegistry, ActivateHelpers } from 'hadron-app-registry';
import { schemaFieldsToAutocompleteItems } from '../modules/fields';

export function activatePlugin(
  _: unknown,
  { globalAppRegistry }: { globalAppRegistry: AppRegistry },
  { on, cleanup }: ActivateHelpers
) {
  const store = createStore(reducer);

  const emitFieldsChanged = (ns: string) => {
    const fieldsState = store.getState()[ns];
    globalAppRegistry.emit('fields-changed', {
      ns,
      ...fieldsState,
      autocompleteFields: schemaFieldsToAutocompleteItems(fieldsState.fields),
    });
  };

  const onDocumentsChanged = async ({
    ns,
    docs,
  }: {
    ns: string;
    docs: Document[];
  }) => {
    try {
      const { fields } = await parseSchema(docs);
      store.dispatch(changeFields(ns, fields));
      emitFieldsChanged(ns);
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
    ({ ns, schema }: { ns: string; schema: Schema }) => {
      store.dispatch(changeFields(ns, schema.fields));
      emitFieldsChanged(ns);
    }
  );

  return { store, deactivate: cleanup };
}

import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/store';

const FieldStorePlugin = registerHadronPlugin({
  name: 'FieldStore',
  component({ children }) {
    // FieldStore plugin doesn't render anything, but keeps track of changes to
    // the namespace documents and maintains a schema to be used with
    // autocompleters
    return <>{children}</>;
  },
  activate: activatePlugin,
});

export {
  type FieldStoreService,
  fieldStoreServiceLocator,
  useAutocompleteFields,
  useFieldsSchema,
} from './stores/context';
export default FieldStorePlugin;

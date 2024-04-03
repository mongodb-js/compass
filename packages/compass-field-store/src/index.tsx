import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/store';
import { connectionsManagerLocator } from '@mongodb-js/compass-connections/provider';

const FieldStorePlugin = registerHadronPlugin(
  {
    name: 'FieldStore',
    component({ children }) {
      // FieldStore plugin doesn't render anything, but keeps track of changes to
      // the namespace documents and maintains a schema to be used with
      // autocompleters
      return <>{children}</>;
    },
    activate: activatePlugin,
  },
  {
    connectionsManager: connectionsManagerLocator,
  }
);

export { useAutocompleteFields, useFieldsSchema } from './stores/hooks';

export {
  type FieldStoreService,
  fieldStoreServiceLocator,
} from './stores/field-store-service';

export default FieldStorePlugin;

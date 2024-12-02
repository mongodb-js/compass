import React from 'react';
import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/store';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';

const FieldStoreComponent: React.FunctionComponent = ({ children }) => {
  // FieldStore plugin doesn't render anything, but keeps track of changes to
  // the namespace documents and maintains a schema to be used with
  // autocompleters
  return <>{children}</>;
};

const FieldStorePlugin = registerHadronPlugin(
  {
    name: 'FieldStore',
    component: FieldStoreComponent,
    activate: activatePlugin,
  },
  {
    connections: connectionsLocator,
    logger: createLoggerLocator('COMPASS-FIELDS-STORE'),
  }
);

export { useAutocompleteFields, useFieldsSchema } from './stores/hooks';

export {
  type FieldStoreService,
  fieldStoreServiceLocator,
} from './stores/field-store-service';

export default FieldStorePlugin;

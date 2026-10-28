import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { connectionsLocator } from '@mongodb-js/compass-connections/provider';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { activatePlugin } from './stores/store';

const FieldStoreComponent: React.FunctionComponent<{
  children?: React.ReactNode;
}> = ({ children }) => {
  // FieldStore plugin doesn't render anything, but keeps track of changes to
  // the namespace documents and maintains a schema to be used with
  // autocompleters
  return <>{children}</>;
};

const FieldStorePlugin = registerCompassPlugin(
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

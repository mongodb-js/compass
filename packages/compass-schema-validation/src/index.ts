import { onActivated } from './stores';
import CompassSchemaValidation from './components/compass-schema-validation';
import { registerHadronPlugin } from 'hadron-app-registry';
import { dataServiceLocator } from 'mongodb-data-service/provider';
import type { DataService } from 'mongodb-data-service';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';
import type { MongoDBInstance } from '@mongodb-js/compass-app-stores/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';

function activate() {
  // no-op
}

function deactivate() {
  // no-op
}

export const CompassSchemaValidationHadronPlugin = registerHadronPlugin<
  CollectionTabPluginMetadata,
  {
    dataService: () => DataService;
    instance: () => MongoDBInstance;
  }
>(
  {
    name: 'CompassSchemaValidationPlugin',
    component: CompassSchemaValidation,
    activate: onActivated,
  },
  {
    dataService: dataServiceLocator,
    instance: mongoDBInstanceLocator,
  }
);
export const CompassSchemaValidationPlugin = {
  name: 'Validation',
  component: CompassSchemaValidationHadronPlugin,
};

export { activate, deactivate };
export { default as metadata } from '../package.json';

import React from 'react';
import { UserData } from '@mongodb-js/compass-user-data';
import type {
  DataModelStorage,
  MongoDBDataModelDescription,
} from './data-model-storage';
import { MongoDBDataModelDescriptionSchema } from './data-model-storage';
import { DataModelStorageServiceProvider } from '../provider';

class DataModelStorageElectron implements DataModelStorage {
  private readonly userData: UserData<typeof MongoDBDataModelDescriptionSchema>;
  constructor(basePath?: string) {
    this.userData = new UserData(MongoDBDataModelDescriptionSchema, {
      subdir: 'DataModelDescriptions',
      basePath,
    });
  }
  save(description: MongoDBDataModelDescription) {
    return this.userData.write(description.id, description);
  }
  async loadAll(): Promise<MongoDBDataModelDescription[]> {
    try {
      const res = await this.userData.readAll();
      return res.data;
    } catch (err) {
      return [];
    }
  }
}

const storage = new DataModelStorageElectron();

export const DataModelStorageServiceProviderElectron: React.FunctionComponent =
  ({ children }) => {
    return (
      <DataModelStorageServiceProvider storage={storage}>
        {children}
      </DataModelStorageServiceProvider>
    );
  };

export default storage;

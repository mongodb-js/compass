import React from 'react';
import { FileUserData } from '@mongodb-js/compass-user-data';
import type {
  DataModelStorage,
  MongoDBDataModelDescription,
} from './data-model-storage';
import { MongoDBDataModelDescriptionSchema } from './data-model-storage';
import { DataModelStorageServiceProvider } from '../provider';

class DataModelStorageElectron implements DataModelStorage {
  private readonly userData: FileUserData<
    typeof MongoDBDataModelDescriptionSchema
  >;
  constructor(basePath?: string) {
    this.userData = new FileUserData(MongoDBDataModelDescriptionSchema, {
      subdir: 'DataModelDescriptions',
      basePath,
    });
  }
  save(description: MongoDBDataModelDescription) {
    return this.userData.write(description.id, description);
  }
  delete(id: MongoDBDataModelDescription['id']) {
    return this.userData.delete(id);
  }
  async loadAll(): Promise<MongoDBDataModelDescription[]> {
    try {
      const res = await this.userData.readAll();
      return res.data;
    } catch {
      return [];
    }
  }
  async load(id: string): Promise<MongoDBDataModelDescription | null> {
    return (
      (await this.loadAll()).find((item) => {
        return item.id === id;
      }) ?? null
    );
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

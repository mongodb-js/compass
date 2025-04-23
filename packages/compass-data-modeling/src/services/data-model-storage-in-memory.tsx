import React from 'react';
import { DataModelStorageServiceProvider } from '../provider';
import type {
  DataModelStorage,
  MongoDBDataModelDescription,
} from './data-model-storage';

class DataModelStorageInMemory implements DataModelStorage {
  private items: Map<string, MongoDBDataModelDescription> = new Map();
  save(description: MongoDBDataModelDescription): Promise<boolean> {
    this.items.set(description.id, description);
    return Promise.resolve(true);
  }
  delete(id: MongoDBDataModelDescription['id']): Promise<boolean> {
    this.items.delete(id);
    return Promise.resolve(true);
  }
  loadAll(): Promise<MongoDBDataModelDescription[]> {
    return Promise.resolve(Array.from(this.items.values()));
  }
  load(id: string): Promise<MongoDBDataModelDescription | null> {
    return Promise.resolve(this.items.get(id) ?? null);
  }
}

const storage = new DataModelStorageInMemory();

export const DataModelStorageServiceProviderInMemory: React.FunctionComponent =
  ({ children }) => {
    return (
      <DataModelStorageServiceProvider storage={storage}>
        {children}
      </DataModelStorageServiceProvider>
    );
  };

export default storage;

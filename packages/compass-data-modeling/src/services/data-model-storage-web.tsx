import { AtlasUserData } from '@mongodb-js/compass-user-data';
import type {
  DataModelStorage,
  MongoDBDataModelDescription,
} from './data-model-storage';
import { MongoDBDataModelDescriptionSchema } from './data-model-storage';
import dataModelStorageInMemory from './data-model-storage-in-memory';
import {
  atlasServiceLocator,
  type AtlasService,
} from '@mongodb-js/atlas-service/provider';
import { createServiceProvider } from '@mongodb-js/compass-app-registry';
import { DataModelStorageServiceProvider } from '../provider';
import React, { useRef } from 'react';
import { mongoLogId, useLogger } from '@mongodb-js/compass-logging/provider';

class DataModelStorageAtlas implements DataModelStorage {
  private readonly userData: AtlasUserData<
    typeof MongoDBDataModelDescriptionSchema
  >;
  constructor(orgId: string, projectId: string, atlasService: AtlasService) {
    this.userData = new AtlasUserData(
      MongoDBDataModelDescriptionSchema,
      'DataModelDescriptions',
      {
        orgId,
        projectId,
        getResourceUrl(path) {
          // TODO(COMPASS-9960): this is copied from compass-web entrypoint for
          // brevity, but shouldn't be defined outside of AtlasUserData, this
          // logic is literally the same between all user data instances and can
          // be encapsulated inside of the AtlasUserData class implementation
          const [type, pathOrgId, pathProjectId, id] =
            path?.split('/').filter(Boolean) || [];

          if (
            !type ||
            !pathOrgId ||
            !pathProjectId ||
            type !== 'DataModelDescriptions'
          ) {
            throw new Error(
              'DataModelStorageAtlas is used outside of Atlas Cloud context'
            );
          }

          return atlasService.userDataEndpoint(
            pathOrgId,
            pathProjectId,
            type,
            id
          );
        },
        authenticatedFetch: atlasService.authenticatedFetch.bind(atlasService),
      }
    );
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

export const DataModelStorageServiceProviderWeb = createServiceProvider(
  function DataModelStorageServiceProviderWeb({
    children,
    orgId,
    projectId,
  }: {
    /**
     * Atlas organization id. Optional. If provided, data model storage will
     * save the user data in Atlas Cloud, otherwise will fall back to in-memory
     * storage
     */
    orgId?: string;
    /**
     * Atlas project id. Optional. If provided, data model storage will
     * save the user data in Atlas Cloud, otherwise will fall back to in-memory
     * storage
     */
    projectId?: string;
    children?: React.ReactNode;
  }) {
    const storageRef = useRef<DataModelStorage>();
    const atlasService = atlasServiceLocator();
    const logger = useLogger('DATA-MODEL-STORAGE');

    if (!storageRef.current) {
      if (orgId && projectId) {
        storageRef.current = new DataModelStorageAtlas(
          orgId,
          projectId,
          atlasService
        );
      } else {
        logger.log.warn(
          mongoLogId(1_001_000_379),
          'DataModelStorageServiceProviderWeb',
          'Falling back to in memory storage because orgId or projectId is missing'
        );
        // Fallback to in-memory if we're outside of Atlas Cloud
        storageRef.current = dataModelStorageInMemory;
      }
    }

    return (
      <DataModelStorageServiceProvider storage={storageRef.current}>
        {children}
      </DataModelStorageServiceProvider>
    );
  }
);

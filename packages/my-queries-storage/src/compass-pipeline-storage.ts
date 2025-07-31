import {
  type IUserData,
  FileUserData,
  AtlasUserData,
} from '@mongodb-js/compass-user-data';
import { PipelineSchema } from './pipeline-storage-schema';
import type { SavedPipeline } from './pipeline-storage-schema';
import type { PipelineStorage } from './pipeline-storage';

export type PipelineStorageOptions = {
  basePath?: string;
  orgId?: string;
  projectId?: string;
  getResourceUrl?: (path?: string) => string;
  authenticatedFetch?: (
    url: RequestInfo | URL,
    options?: RequestInit
  ) => Promise<Response>;
};

export class CompassPipelineStorage implements PipelineStorage {
  private readonly userData: IUserData<typeof PipelineSchema>;
  constructor(options: PipelineStorageOptions = {}) {
    const dataType = 'SavedPipelines';
    if (
      options.orgId &&
      options.projectId &&
      options.getResourceUrl &&
      options.authenticatedFetch
    ) {
      this.userData = new AtlasUserData(
        PipelineSchema,
        'favoriteAggregations',
        options.orgId,
        options.projectId,
        options.getResourceUrl,
        options.authenticatedFetch,
        {}
      );
    } else {
      this.userData = new FileUserData(PipelineSchema, dataType, {
        basePath: options.basePath,
      });
    }
  }

  async loadAll(): Promise<SavedPipeline[]> {
    try {
      const { data } = await this.userData.readAll();
      return data;
    } catch {
      return [];
    }
  }

  /** loads all pipelines that satisfy `predicate` */
  loadMany(
    predicate: (arg0: SavedPipeline) => boolean
  ): Promise<SavedPipeline[]> {
    return this.loadAll().then((pipelines) => pipelines.filter(predicate));
  }

  async createOrUpdate(
    id: string,
    attributes: Omit<SavedPipeline, 'lastModified'>
  ) {
    const pipelineExists = Boolean(await this.userData.readOne(id));
    return await (pipelineExists
      ? this.updateAttributes(id, attributes)
      : this.create(attributes));
  }

  async create(data: Omit<SavedPipeline, 'lastModified'>): Promise<boolean> {
    try {
      await this.userData.write(data.id, {
        ...data,
        lastModified: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  }

  async updateAttributes(
    id: string,
    attributes: Partial<SavedPipeline>
  ): Promise<boolean> {
    try {
      await this.userData.write(id, {
        ...(await this.userData.readOne(id)),
        ...attributes,
        lastModified: Date.now(),
      });
      return true;
    } catch {
      return false;
    }
  }

  async delete(id: string) {
    await this.userData.delete(id);
  }
}

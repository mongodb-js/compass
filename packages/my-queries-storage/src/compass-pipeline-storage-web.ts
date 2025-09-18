import { EJSON } from 'bson';
import { AtlasUserData } from '@mongodb-js/compass-user-data';
import { PipelineSchema } from './pipeline-storage-schema';
import type { SavedPipeline } from './pipeline-storage-schema';
import type { PipelineStorageInterface } from './storage-interfaces';

export type WebPipelineStorageOptions = {
  orgId: string;
  projectId: string;
  getResourceUrl: (path?: string) => string;
  authenticatedFetch: (
    url: RequestInfo | URL,
    options?: RequestInit
  ) => Promise<Response>;
};

export class WebCompassPipelineStorage implements PipelineStorageInterface {
  private readonly userData: AtlasUserData<typeof PipelineSchema>;

  constructor(options: WebPipelineStorageOptions) {
    this.userData = new AtlasUserData(PipelineSchema, 'favoriteAggregations', {
      orgId: options.orgId,
      projectId: options.projectId,
      getResourceUrl: options.getResourceUrl,
      authenticatedFetch: options.authenticatedFetch,
      serialize: (content) => EJSON.stringify(content),
      deserialize: (content: string) => EJSON.parse(content),
    });
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
  ): Promise<boolean> {
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

  async delete(id: string): Promise<void> {
    await this.userData.delete(id);
  }
}

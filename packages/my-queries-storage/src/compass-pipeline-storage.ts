import { FileUserData } from '@mongodb-js/compass-user-data';
import { PipelineSchema } from './pipeline-storage-schema';
import type { SavedPipeline } from './pipeline-storage-schema';
import type { PipelineStorage } from './pipeline-storage';

export class CompassPipelineStorage implements PipelineStorage {
  private readonly userData: FileUserData<typeof PipelineSchema>;
  constructor(basePath?: string) {
    this.userData = new FileUserData(PipelineSchema, 'SavedPipelines', {
      basePath,
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

  private async loadOne(id: string): Promise<SavedPipeline> {
    return await this.userData.readOne(id);
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

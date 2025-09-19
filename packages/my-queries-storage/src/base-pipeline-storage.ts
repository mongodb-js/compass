import type { IUserData, z } from '@mongodb-js/compass-user-data';
import type { SavedPipeline } from './pipeline-storage-schema';
import type { PipelineStorageInterface } from './storage-interfaces';

// Generic base class for pipeline storage that works with any IUserData implementation
export class BaseCompassPipelineStorage<TSchema extends z.Schema>
  implements PipelineStorageInterface
{
  private readonly userData: IUserData<TSchema>;

  constructor(userData: IUserData<TSchema>) {
    this.userData = userData;
  }

  async loadAll(): Promise<SavedPipeline[]> {
    try {
      const { data } = await this.userData.readAll();
      return data as SavedPipeline[];
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

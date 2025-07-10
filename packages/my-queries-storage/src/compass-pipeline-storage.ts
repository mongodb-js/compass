import type { Stats } from '@mongodb-js/compass-user-data';
import { FileUserData } from '@mongodb-js/compass-user-data';
import { PipelineSchema } from './pipeline-storage-schema';
import type { SavedPipeline } from './pipeline-storage-schema';
import type { PipelineStorage } from './pipeline-storage';

export class CompassPipelineStorage implements PipelineStorage {
  private readonly userData: FileUserData<typeof PipelineSchema>;
  constructor(basePath?: string) {
    this.userData = new FileUserData(PipelineSchema, {
      subdir: 'SavedPipelines',
      basePath,
    });
  }

  private mergeStats(pipeline: SavedPipeline, stats: Stats): SavedPipeline {
    return {
      ...pipeline,
      lastModified: new Date(stats.ctimeMs),
    };
  }

  async loadAll(): Promise<SavedPipeline[]> {
    try {
      const { data } = await this.userData.readAllWithStats({
        ignoreErrors: false,
      });
      return data.map(([item, stats]) => {
        return this.mergeStats(item, stats);
      });
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
    const [item, stats] = await this.userData.readOneWithStats(id);
    return this.mergeStats(item, stats);
  }

  async createOrUpdate(id: string, attributes: SavedPipeline) {
    const pipelineExists = Boolean(
      await this.userData.readOne(id, {
        ignoreErrors: true,
      })
    );
    return await (pipelineExists
      ? this.updateAttributes(id, attributes)
      : this.create(attributes));
  }

  private async create(data: SavedPipeline) {
    await this.userData.write(data.id, {
      ...data,
      lastModified: Date.now(),
    });
    return await this.loadOne(data.id);
  }

  async updateAttributes(
    id: string,
    attributes: Partial<SavedPipeline>
  ): Promise<SavedPipeline> {
    await this.userData.write(id, {
      ...(await this.loadOne(id)),
      ...attributes,
      lastModified: Date.now(),
    });
    return await this.loadOne(id);
  }

  async delete(id: string) {
    await this.userData.delete(id);
  }
}

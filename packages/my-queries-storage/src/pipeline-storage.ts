import type { SavedPipeline } from './pipeline-storage-schema';

export interface PipelineStorage {
  loadAll(): Promise<SavedPipeline[]>;
  loadMany(
    predicate: (arg0: SavedPipeline) => boolean
  ): Promise<SavedPipeline[]>;
  createOrUpdate(id: string, attributes: SavedPipeline): Promise<SavedPipeline>;
  create(attributes: SavedPipeline): Promise<SavedPipeline>;
  updateAttributes(
    id: string,
    attributes: Partial<SavedPipeline>
  ): Promise<SavedPipeline>;
  delete(id: string): Promise<void>;
}

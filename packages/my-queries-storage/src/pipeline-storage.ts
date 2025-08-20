import type { SavedPipeline } from './pipeline-storage-schema';

export interface PipelineStorage {
  loadAll(): Promise<SavedPipeline[]>;
  loadMany(
    predicate: (arg0: SavedPipeline) => boolean
  ): Promise<SavedPipeline[]>;
  createOrUpdate(
    id: string,
    attributes: Omit<SavedPipeline, 'lastModified'>
  ): Promise<boolean>;
  create(attributes: Omit<SavedPipeline, 'lastModified'>): Promise<boolean>;
  updateAttributes(
    id: string,
    attributes: Partial<SavedPipeline>
  ): Promise<boolean>;
  delete(id: string): Promise<void>;
}

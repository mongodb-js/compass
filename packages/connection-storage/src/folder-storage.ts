import type { Folder, FolderAssignment } from './folder';

export type { Folder, FolderAssignment };

export interface FolderStorage {
  loadAll(options?: { signal?: AbortSignal }): Promise<Folder[]>;

  save(options: { folder: Folder; signal?: AbortSignal }): Promise<void>;

  delete(options: { id: string; signal?: AbortSignal }): Promise<void>;
}

export interface FolderAssignmentStorage {
  loadAll(options?: { signal?: AbortSignal }): Promise<FolderAssignment[]>;

  save(options: {
    assignment: FolderAssignment;
    signal?: AbortSignal;
  }): Promise<void>;

  delete(options: {
    itemType: FolderAssignment['itemType'];
    itemId: string;
    signal?: AbortSignal;
  }): Promise<void>;
}

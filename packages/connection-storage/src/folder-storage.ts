import type { Folder, FolderAssignment } from './folder';

export type { Folder, FolderAssignment };

/**
 * Folders and assignments are deliberately two independent records rather
 * than one document with folders owning a member list: that keeps a move a
 * single atomic write to the one assignment that changed, instead of two
 * writes to two folder documents that can diverge if the process stops
 * between them. The cost is that nothing here enforces referential integrity
 * between the two -- an assignment can point at a folder that no longer
 * exists, for example if the process stops after a folder is deleted but
 * before its assignments are cleaned up.
 *
 * That case isn't treated as corruption: a FolderAssignmentStorage.loadAll()
 * entry whose folderId doesn't resolve to a live Folder is read as
 * uncategorized by whoever consumes both lists together, the same as an item
 * with no assignment at all. Reconciling the two (for example, sweeping
 * dangling assignments after a folder delete) is the responsibility of the
 * code that orchestrates deletes across both stores, not of either store.
 */
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

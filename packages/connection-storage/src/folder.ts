/**
 * A named container used to organize saved items. Folders are stored as a flat
 * list: Milestone 1 is single-level and a folder has no parent field. Nested
 * folders are a future possibility, and adding them is additive — a folder
 * would gain an optional parent reference and existing folders would read as
 * top-level, so no stored record has to be rewritten or migrated.
 */
export interface Folder {
  readonly id: string;
  name: string;
  /**
   * Last folder change: create, rename, or a connection moved in. Milestone 3
   * orders folders by it, newest first. Folders without it order as oldest.
   */
  lastModifiedAt?: Date;
}

/**
 * Records that an item is in a folder. One record per categorized item, which
 * makes "at most one folder per item" structural rather than a convention.
 */
export interface FolderAssignment {
  /**
   * Only 'connection' in Milestone 1. Written as a union so other saved items
   * can be filed in a folder later without changing the folder schema or
   * migrating existing records.
   */
  readonly itemType: 'connection';
  readonly itemId: string;
  readonly folderId: string;
}

/**
 * Folders are stored as a flat list: Milestone 1 is single-level and a folder
 * has no parent field. Adding one later is additive — existing folders would
 * read as top-level, so no stored record has to be rewritten or migrated.
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
 * Folders and their membership are one record, read and written together, so
 * there's no scenario where an assignment outlives its folder or vice versa.
 * Membership is a map, not a list on each folder, so a connection id can
 * resolve to at most one folderId -- the same connection can't end up
 * assigned to two folders by construction.
 */
export interface FolderOrganization {
  folders: Folder[];
  /** connectionId -> folderId. A connection absent here is uncategorized. */
  assignments: Record<string, string>;
}

import type { Folder, FolderOrganization } from './folder';

export type { Folder, FolderOrganization };

export interface FolderStorage {
  load(): Promise<FolderOrganization>;

  save(options: { folderOrganization: FolderOrganization }): Promise<void>;
}

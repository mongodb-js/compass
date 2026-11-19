import type { FolderOrganization, FolderStorage } from './folder-storage';

export class InMemoryFolderStorage implements FolderStorage {
  private folderOrganization: FolderOrganization;

  constructor(
    folderOrganization: FolderOrganization = { folders: [], assignments: {} }
  ) {
    this.folderOrganization = cloneFolderOrganization(folderOrganization);
  }

  load(): Promise<FolderOrganization> {
    return Promise.resolve(cloneFolderOrganization(this.folderOrganization));
  }

  save({
    folderOrganization,
  }: {
    folderOrganization: FolderOrganization;
  }): Promise<void> {
    this.folderOrganization = cloneFolderOrganization(folderOrganization);
    return Promise.resolve();
  }
}

function cloneFolderOrganization(
  folderOrganization: FolderOrganization
): FolderOrganization {
  return {
    folders: [...folderOrganization.folders],
    assignments: { ...folderOrganization.assignments },
  };
}

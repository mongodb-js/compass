import type { FolderOrganization, FolderStorage } from './folder-storage';

export class InMemoryFolderStorage implements FolderStorage {
  private organization: FolderOrganization;

  constructor(
    organization: FolderOrganization = { folders: [], assignments: {} }
  ) {
    this.organization = cloneOrganization(organization);
  }

  load(): Promise<FolderOrganization> {
    return Promise.resolve(cloneOrganization(this.organization));
  }

  save({ organization }: { organization: FolderOrganization }): Promise<void> {
    this.organization = cloneOrganization(organization);
    return Promise.resolve();
  }
}

function cloneOrganization(
  organization: FolderOrganization
): FolderOrganization {
  return {
    folders: [...organization.folders],
    assignments: { ...organization.assignments },
  };
}

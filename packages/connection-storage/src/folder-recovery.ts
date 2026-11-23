import type { FolderOrganization } from './folder-storage';

export type ReconcileFolderOrganizationResult = {
  folderOrganization: FolderOrganization;
  /** connectionId -> folderId entries dropped because the folderId doesn't resolve. */
  danglingAssignments: Record<string, string>;
};

// Keeps stored data from accumulating assignments to folders that no longer exist.
export function reconcileFolderOrganization(
  folderOrganization: FolderOrganization
): ReconcileFolderOrganizationResult {
  const folderIds = new Set(
    folderOrganization.folders.map((folder) => folder.id)
  );

  const assignments: Record<string, string> = Object.create(null);
  const danglingAssignments: Record<string, string> = Object.create(null);

  for (const [connectionId, folderId] of Object.entries(
    folderOrganization.assignments
  )) {
    if (folderIds.has(folderId)) {
      assignments[connectionId] = folderId;
    } else {
      danglingAssignments[connectionId] = folderId;
    }
  }

  return {
    folderOrganization: { ...folderOrganization, assignments },
    danglingAssignments,
  };
}

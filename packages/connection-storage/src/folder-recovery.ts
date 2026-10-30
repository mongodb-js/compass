import type { Folder, FolderAssignment } from './folder';

export type ReconcileFolderAssignmentsResult = {
  /** Assignments whose folder and item both still exist. */
  assignments: FolderAssignment[];
  /** Assignments pointing at a folder or an item that is not there. */
  orphanedAssignments: FolderAssignment[];
};

/**
 * Splits assignments into the ones that still point at an existing folder and
 * item, and the ones that do not.
 *
 * Orphans are expected rather than exceptional. Folders and assignments are
 * separate files, so an interrupted delete leaves an assignment behind, and a
 * connection can be deleted by a version that does not know about assignments
 * yet. Keeping an assignment whose folder is gone files the item under a folder
 * that is never rendered, which hides the item from the list entirely.
 *
 * Callers decide what to do with the orphans: the list itself only needs the
 * reconciled assignments, while deleting them is a write, and a version that
 * does not understand a record should not be the one to remove it.
 */
export function reconcileFolderAssignments({
  folders,
  assignments,
  knownItemIds,
}: {
  folders: readonly Folder[];
  assignments: readonly FolderAssignment[];
  /** Ids of the items assignments may point at, connections today. */
  knownItemIds: ReadonlySet<string>;
}): ReconcileFolderAssignmentsResult {
  const folderIds = new Set(folders.map((folder) => folder.id));

  const result: ReconcileFolderAssignmentsResult = {
    assignments: [],
    orphanedAssignments: [],
  };

  for (const assignment of assignments) {
    const isOrphan =
      !folderIds.has(assignment.folderId) ||
      !knownItemIds.has(assignment.itemId);
    if (isOrphan) {
      result.orphanedAssignments.push(assignment);
    } else {
      result.assignments.push(assignment);
    }
  }

  return result;
}

import { randomUUID } from 'node:crypto';
import { expect } from 'chai';

import { reconcileFolderAssignments } from './folder-recovery';
import type { Folder, FolderAssignment } from './folder';

function getFolder(props: Partial<Folder> = {}): Folder {
  return {
    id: randomUUID(),
    name: 'My folder',
    ...props,
  };
}

function getFolderAssignment(
  props: Partial<FolderAssignment> = {}
): FolderAssignment {
  return {
    itemType: 'connection',
    itemId: randomUUID(),
    folderId: randomUUID(),
    ...props,
  };
}

describe('reconcileFolderAssignments', function () {
  it('should keep an assignment whose folder and item exist', function () {
    const folder = getFolder();
    const connectionId = randomUUID();
    const assignment = getFolderAssignment({
      folderId: folder.id,
      itemId: connectionId,
    });

    const result = reconcileFolderAssignments({
      folders: [folder],
      assignments: [assignment],
      knownItemIds: new Set([connectionId]),
    });

    expect(result.assignments).to.deep.equal([assignment]);
    expect(result.orphanedAssignments).to.deep.equal([]);
  });

  it('should orphan an assignment whose folder is gone', function () {
    const connectionId = randomUUID();
    const assignment = getFolderAssignment({ itemId: connectionId });

    const result = reconcileFolderAssignments({
      folders: [],
      assignments: [assignment],
      knownItemIds: new Set([connectionId]),
    });

    expect(result.assignments).to.deep.equal([]);
    expect(result.orphanedAssignments).to.deep.equal([assignment]);
  });

  it('should orphan an assignment whose item is gone', function () {
    const folder = getFolder();
    const assignment = getFolderAssignment({ folderId: folder.id });

    const result = reconcileFolderAssignments({
      folders: [folder],
      assignments: [assignment],
      knownItemIds: new Set(),
    });

    expect(result.assignments).to.deep.equal([]);
    expect(result.orphanedAssignments).to.deep.equal([assignment]);
  });

  it('should sort a mix of assignments without reordering them', function () {
    const folder = getFolder();
    const keptItemId = randomUUID();
    const kept = getFolderAssignment({
      folderId: folder.id,
      itemId: keptItemId,
    });
    const orphaned = getFolderAssignment({ folderId: folder.id });
    const alsoKept = getFolderAssignment({
      folderId: folder.id,
      itemId: keptItemId,
    });

    const result = reconcileFolderAssignments({
      folders: [folder],
      assignments: [kept, orphaned, alsoKept],
      knownItemIds: new Set([keptItemId]),
    });

    expect(result.assignments).to.deep.equal([kept, alsoKept]);
    expect(result.orphanedAssignments).to.deep.equal([orphaned]);
  });

  it('should return empty results with no folders or assignments', function () {
    const result = reconcileFolderAssignments({
      folders: [],
      assignments: [],
      knownItemIds: new Set(),
    });

    expect(result).to.deep.equal({
      assignments: [],
      orphanedAssignments: [],
    });
  });
});

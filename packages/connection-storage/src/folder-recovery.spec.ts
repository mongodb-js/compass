import { randomUUID } from 'node:crypto';
import { expect } from 'chai';

import { reconcileFolderOrganization } from './folder-recovery';
import type { Folder } from './folder-storage';

function getFolder(props: Partial<Folder> = {}): Folder {
  return { id: randomUUID(), name: 'My folder', ...props };
}

describe('reconcileFolderOrganization', function () {
  it('keeps an assignment whose folder exists', function () {
    const folder = getFolder();
    const result = reconcileFolderOrganization({
      folders: [folder],
      assignments: { 'connection-1': folder.id },
    });

    expect(result.folderOrganization).to.deep.equal({
      folders: [folder],
      assignments: { 'connection-1': folder.id },
    });
    expect(result.danglingAssignments).to.deep.equal({});
  });

  it('drops an assignment whose folder is gone', function () {
    const result = reconcileFolderOrganization({
      folders: [],
      assignments: { 'connection-1': 'missing-folder' },
    });

    expect(result.folderOrganization).to.deep.equal({
      folders: [],
      assignments: {},
    });
    expect(result.danglingAssignments).to.deep.equal({
      'connection-1': 'missing-folder',
    });
  });

  it('keeps the folders list untouched', function () {
    const folder = getFolder();
    const result = reconcileFolderOrganization({
      folders: [folder],
      assignments: { 'connection-1': 'missing-folder' },
    });

    expect(result.folderOrganization.folders).to.deep.equal([folder]);
  });

  it('only drops assignments pointing at a missing folder, out of a mix', function () {
    const folder = getFolder();
    const result = reconcileFolderOrganization({
      folders: [folder],
      assignments: {
        'connection-1': folder.id,
        'connection-2': 'missing-folder',
      },
    });

    expect(result.folderOrganization.assignments).to.deep.equal({
      'connection-1': folder.id,
    });
    expect(result.danglingAssignments).to.deep.equal({
      'connection-2': 'missing-folder',
    });
  });

  it('returns empty results with no folders or assignments', function () {
    const result = reconcileFolderOrganization({
      folders: [],
      assignments: {},
    });

    expect(result).to.deep.equal({
      folderOrganization: { folders: [], assignments: {} },
      danglingAssignments: {},
    });
  });
});

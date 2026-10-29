import { expect } from 'chai';
import { randomUUID } from 'crypto';

import {
  InMemoryFolderStorage,
  InMemoryFolderAssignmentStorage,
} from './in-memory-folder-storage';
import type { Folder, FolderAssignment } from './folder-storage';

function getFolder(props: Partial<Folder> = {}): Folder {
  return { id: randomUUID(), name: 'My folder', ...props };
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

describe('InMemoryFolderStorage', function () {
  it('should be empty by default', async function () {
    expect(await new InMemoryFolderStorage().loadAll()).to.deep.equal([]);
  });

  it('should load the folders it was created with', async function () {
    const folder = getFolder();
    expect(await new InMemoryFolderStorage([folder]).loadAll()).to.deep.equal([
      folder,
    ]);
  });

  it('should save a folder', async function () {
    const storage = new InMemoryFolderStorage();
    const folder = getFolder();
    await storage.save({ folder });
    expect(await storage.loadAll()).to.deep.equal([folder]);
  });

  it('should replace an existing folder instead of duplicating it', async function () {
    const folder = getFolder();
    const storage = new InMemoryFolderStorage([folder]);
    await storage.save({ folder: { ...folder, name: 'Renamed' } });

    const folders = await storage.loadAll();
    expect(folders).to.have.lengthOf(1);
    expect(folders[0].name).to.equal('Renamed');
  });

  it('should delete a folder', async function () {
    const folder = getFolder();
    const storage = new InMemoryFolderStorage([folder]);
    await storage.delete({ id: folder.id });
    expect(await storage.loadAll()).to.deep.equal([]);
  });

  it('should do nothing when deleting a folder that does not exist', async function () {
    const folder = getFolder();
    const storage = new InMemoryFolderStorage([folder]);
    await storage.delete({ id: randomUUID() });
    expect(await storage.loadAll()).to.deep.equal([folder]);
  });
});

describe('InMemoryFolderAssignmentStorage', function () {
  it('should be empty by default', async function () {
    expect(await new InMemoryFolderAssignmentStorage().loadAll()).to.deep.equal(
      []
    );
  });

  it('should save an assignment', async function () {
    const storage = new InMemoryFolderAssignmentStorage();
    const assignment = getFolderAssignment();
    await storage.save({ assignment });
    expect(await storage.loadAll()).to.deep.equal([assignment]);
  });

  it('should move an item in a single record', async function () {
    const itemId = randomUUID();
    const storage = new InMemoryFolderAssignmentStorage();
    await storage.save({
      assignment: {
        itemType: 'connection',
        itemId,
        folderId: randomUUID(),
      },
    });
    const secondFolderId = randomUUID();
    await storage.save({
      assignment: { itemType: 'connection', itemId, folderId: secondFolderId },
    });

    expect(await storage.loadAll()).to.deep.equal([
      { itemType: 'connection', itemId, folderId: secondFolderId },
    ]);
  });

  it('should delete an assignment by item', async function () {
    const assignment = getFolderAssignment();
    const storage = new InMemoryFolderAssignmentStorage([assignment]);
    await storage.delete({
      itemType: assignment.itemType,
      itemId: assignment.itemId,
    });
    expect(await storage.loadAll()).to.deep.equal([]);
  });

  it('should only delete the assignment of the given item', async function () {
    const kept = getFolderAssignment();
    const removed = getFolderAssignment();
    const storage = new InMemoryFolderAssignmentStorage([kept, removed]);

    await storage.delete({
      itemType: removed.itemType,
      itemId: removed.itemId,
    });

    expect(await storage.loadAll()).to.deep.equal([kept]);
  });
});

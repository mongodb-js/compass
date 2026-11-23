import { randomUUID } from 'node:crypto';
import { expect } from 'chai';

import { InMemoryFolderStorage } from './in-memory-folder-storage';
import type { Folder, FolderOrganization } from './folder-storage';

function getFolder(props: Partial<Folder> = {}): Folder {
  return { id: randomUUID(), name: 'My folder', ...props };
}

describe('InMemoryFolderStorage', function () {
  it('should load an empty folder organization by default', async function () {
    expect(await new InMemoryFolderStorage().load()).to.deep.equal({
      folders: [],
      assignments: {},
    });
  });

  it('should load the folder organization it was created with', async function () {
    const folderOrganization: FolderOrganization = {
      folders: [getFolder()],
      assignments: { 'connection-1': 'folder-1' },
    };
    expect(
      await new InMemoryFolderStorage(folderOrganization).load()
    ).to.deep.equal(folderOrganization);
  });

  it('should save and reload the whole folder organization', async function () {
    const storage = new InMemoryFolderStorage();
    const folderOrganization: FolderOrganization = {
      folders: [getFolder()],
      assignments: { 'connection-1': 'folder-1' },
    };
    await storage.save({ folderOrganization });
    expect(await storage.load()).to.deep.equal(folderOrganization);
  });

  it('should replace the previous folder organization entirely, not merge into it', async function () {
    const storage = new InMemoryFolderStorage({
      folders: [getFolder()],
      assignments: { 'connection-1': 'folder-1' },
    });
    const next: FolderOrganization = { folders: [], assignments: {} };

    await storage.save({ folderOrganization: next });

    expect(await storage.load()).to.deep.equal(next);
  });

  it('should not return a reference to the stored folder organization', async function () {
    const storage = new InMemoryFolderStorage();
    const loaded = await storage.load();
    loaded.folders.push(getFolder());
    loaded.assignments['connection-1'] = 'folder-1';

    expect(await storage.load()).to.deep.equal({
      folders: [],
      assignments: {},
    });
  });
});

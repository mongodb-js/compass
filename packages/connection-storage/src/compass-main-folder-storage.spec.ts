import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Sinon from 'sinon';
import { expect } from 'chai';
import {
  type IUserData,
  type ReadAllResult,
} from '@mongodb-js/compass-user-data';

import {
  initCompassMainFolderStorage,
  CompassMainFolderStorage,
  CompassMainFolderAssignmentStorage,
  type FolderStorageIPCMain,
} from './compass-main-folder-storage';
import type { Folder, FolderAssignment } from './folder-storage';

// A minimal IUserData double. The injected-userData constructor is only
// testable in isolation if something other than FileUserData can stand in for
// it, so this is also a check that the dependency injection works at all.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createFakeUserData(
  overrides: {
    write?: () => Promise<boolean>;
    delete?: Sinon.SinonStub | (() => Promise<boolean>);
    readAll?: () => Promise<ReadAllResult<any>>;
    readOne?: () => Promise<unknown>;
  } = {}
  // The storage classes are generic over the module's own (unexported) zod
  // schemas, which this fake has no way to name from outside the module --
  // `any` here stands in for "whatever schema the class under test expects".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): IUserData<any> {
  return {
    write: overrides.write ?? (() => Promise.resolve(true)),
    delete: overrides.delete ?? (() => Promise.resolve(true)),
    readAll:
      overrides.readAll ?? (() => Promise.resolve({ data: [], errors: [] })),
    readOne: overrides.readOne ?? (() => Promise.resolve(undefined)),
    updateAttributes: () => Promise.resolve(true),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as IUserData<any>;
}

function createFakeIpcMain(): FolderStorageIPCMain {
  return { createHandle: Sinon.stub() };
}

function getFolderFilePath(tmpDir: string, id: string): string {
  return path.join(tmpDir, 'Folders', `${id}.json`);
}

// The assignment's storage id is an opaque UUID, not derived from
// (itemType, itemId), so tests that need to inspect the file on disk find it
// by listing the directory rather than computing its name.
async function readAssignmentFiles(
  tmpDir: string
): Promise<Record<string, unknown>[]> {
  const dir = path.join(tmpDir, 'FolderAssignments');
  const fileNames = await fs.readdir(dir).catch(() => []);
  return Promise.all(
    fileNames.map(async (fileName) =>
      JSON.parse(await fs.readFile(path.join(dir, fileName), 'utf-8'))
    )
  );
}

async function writeFakeFolder(
  tmpDir: string,
  folder: Record<string, unknown>
) {
  const filePath = getFolderFilePath(tmpDir, folder.id as string);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(folder));
}

async function readFolderFile(tmpDir: string, id: string) {
  return JSON.parse(await fs.readFile(getFolderFilePath(tmpDir, id), 'utf-8'));
}

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

describe('FolderStorage', function () {
  let folderStorage: CompassMainFolderStorage;
  let folderAssignmentStorage: CompassMainFolderAssignmentStorage;
  let ipcMain: FolderStorageIPCMain;
  let tmpDir: string;

  beforeEach(async function () {
    ipcMain = { createHandle: Sinon.stub() };
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-storage-tests'));
    ({ folders: folderStorage, assignments: folderAssignmentStorage } =
      initCompassMainFolderStorage(tmpDir, ipcMain, true));
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true, force: true });
    Sinon.restore();
  });

  it('should expose both stores over IPC', function () {
    const channels = (ipcMain.createHandle as Sinon.SinonStub)
      .getCalls()
      .map((call) => call.args[0]);
    expect(channels).to.deep.equal([
      'FolderStorage',
      'FolderAssignmentStorage',
    ]);
  });

  describe('folders', function () {
    describe('loadAll', function () {
      it('should load an empty array with no folders', async function () {
        expect(await folderStorage.loadAll()).to.deep.equal([]);
      });

      it('should return the saved folders', async function () {
        const folder = getFolder();
        await folderStorage.save({ folder });
        expect(await folderStorage.loadAll()).to.deep.equal([folder]);
      });

      it('should convert lastModifiedAt to a date', async function () {
        const folder = getFolder();
        await writeFakeFolder(tmpDir, {
          ...folder,
          lastModifiedAt: '2026-01-05T13:51:27.585Z',
        });
        const [loaded] = await folderStorage.loadAll();
        expect(loaded.lastModifiedAt).to.be.a('date');
        expect(loaded.lastModifiedAt?.toISOString()).to.equal(
          '2026-01-05T13:51:27.585Z'
        );
      });

      it('should preserve fields it does not know about', async function () {
        // Older versions must not strip data written by newer ones, otherwise
        // adding a folder parent reference later would lose it on a downgrade.
        const folder = getFolder();
        await writeFakeFolder(tmpDir, { ...folder, parentId: 'some-parent' });
        const [loaded] = await folderStorage.loadAll();
        expect(loaded).to.have.property('parentId', 'some-parent');
      });

      it('should skip a corrupt file and still load the rest', async function () {
        const folder = getFolder();
        await folderStorage.save({ folder });
        await fs.writeFile(
          path.join(tmpDir, 'Folders', 'broken.json'),
          'not json'
        );

        expect(await folderStorage.loadAll()).to.deep.equal([folder]);
      });

      it('should abort if the signal is already aborted', async function () {
        const controller = new AbortController();
        controller.abort();
        const err = await folderStorage
          .loadAll({ signal: controller.signal })
          .catch((err) => err);
        expect(err).to.have.property('name', 'AbortError');
      });
    });

    describe('save', function () {
      it('should write one file per folder, named after its id', async function () {
        const folder = getFolder({ name: 'Production' });
        await folderStorage.save({ folder });
        expect(await readFolderFile(tmpDir, folder.id)).to.deep.equal({
          id: folder.id,
          name: 'Production',
        });
      });

      it('should overwrite an existing folder instead of duplicating it', async function () {
        const folder = getFolder();
        await folderStorage.save({ folder });
        await folderStorage.save({ folder: { ...folder, name: 'Renamed' } });

        const folders = await folderStorage.loadAll();
        expect(folders).to.have.lengthOf(1);
        expect(folders[0].name).to.equal('Renamed');
      });

      it('should reject a folder without an id', async function () {
        expect(
          await folderStorage
            .save({ folder: { name: 'No id' } as unknown as Folder })
            .catch((err) => err)
        ).to.be.an('error');
      });
    });

    describe('delete', function () {
      it('should delete the folder', async function () {
        const folder = getFolder();
        await folderStorage.save({ folder });
        await folderStorage.delete({ id: folder.id });
        expect(await folderStorage.loadAll()).to.deep.equal([]);
      });

      it('should do nothing if no id is passed', async function () {
        await folderStorage.delete({ id: '' });
      });
    });
  });

  describe('folder assignments', function () {
    describe('loadAll', function () {
      it('should load an empty array with no assignments', async function () {
        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([]);
      });

      it('should return the saved assignments', async function () {
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });
        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([
          assignment,
        ]);
      });

      it('should skip a corrupt file and still load the rest', async function () {
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });
        await fs.writeFile(
          path.join(tmpDir, 'FolderAssignments', 'broken.json'),
          'not json'
        );

        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([
          assignment,
        ]);
      });
    });

    describe('save', function () {
      it('should name the file after an id derived from the item, not a plain composite key', async function () {
        // A filename literally equal to "<itemType>-<itemId>" isn't a
        // well-formed id on the web backend, so the filename is instead a
        // deterministic UUID derived from that same pair.
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });

        const fileNames = await fs.readdir(
          path.join(tmpDir, 'FolderAssignments')
        );
        expect(fileNames).to.have.lengthOf(1);
        expect(fileNames[0]).to.not.equal(
          `${assignment.itemType}-${assignment.itemId}.json`
        );
      });

      it('should save the same item under the same filename every time', async function () {
        // The id is derived from the item, not looked up, so saving the same
        // item again finds the existing file by recomputing its name, rather
        // than needing to search for it first.
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });
        const [fileName] = await fs.readdir(
          path.join(tmpDir, 'FolderAssignments')
        );

        await folderAssignmentStorage.save({
          assignment: { ...assignment, folderId: randomUUID() },
        });

        expect(
          await fs.readdir(path.join(tmpDir, 'FolderAssignments'))
        ).to.deep.equal([fileName]);
      });

      it('should resolve two concurrent saves of the same item to a single file', async function () {
        // The id is computed synchronously from the item before either save
        // awaits any I/O, so two saves racing for the same item both resolve
        // to the same filename instead of each writing a different one.
        const assignment = getFolderAssignment();

        await Promise.all([
          folderAssignmentStorage.save({ assignment }),
          folderAssignmentStorage.save({ assignment }),
        ]);

        expect(await readAssignmentFiles(tmpDir)).to.have.lengthOf(1);
      });

      it('should move an item in a single record', async function () {
        // Moving an item between folders is one write to one file, so a
        // connection can never end up in two folders.
        const itemId = randomUUID();
        const firstFolderId = randomUUID();
        const secondFolderId = randomUUID();

        await folderAssignmentStorage.save({
          assignment: {
            itemType: 'connection',
            itemId,
            folderId: firstFolderId,
          },
        });
        await folderAssignmentStorage.save({
          assignment: {
            itemType: 'connection',
            itemId,
            folderId: secondFolderId,
          },
        });

        // Still exactly one file: the move computed the same id and
        // overwrote the existing record instead of creating a second one.
        expect(await readAssignmentFiles(tmpDir)).to.have.lengthOf(1);

        const assignments = await folderAssignmentStorage.loadAll();
        expect(assignments).to.deep.equal([
          { itemType: 'connection', itemId, folderId: secondFolderId },
        ]);
      });
    });

    describe('delete', function () {
      it('should delete the assignment', async function () {
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });
        await folderAssignmentStorage.delete({
          itemType: assignment.itemType,
          itemId: assignment.itemId,
        });
        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([]);
      });

      it('should only delete the assignment of the given item', async function () {
        const kept = getFolderAssignment();
        const removed = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment: kept });
        await folderAssignmentStorage.save({ assignment: removed });

        await folderAssignmentStorage.delete({
          itemType: removed.itemType,
          itemId: removed.itemId,
        });

        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([kept]);
      });

      it('should do nothing when the item was never assigned', async function () {
        // The id is derived, not looked up, so a delete for an item that was
        // never saved still computes a real id -- pointing at a file that was
        // never written. That must stay a silent no-op, not a failed delete.
        await folderAssignmentStorage.delete({
          itemType: 'connection',
          itemId: randomUUID(),
        });
        expect(await readAssignmentFiles(tmpDir)).to.deep.equal([]);
      });

      it('should do nothing if no item id is passed', async function () {
        await folderAssignmentStorage.delete({
          itemType: 'connection',
          itemId: '',
        });
      });
    });
  });
});

describe('dependency injection', function () {
  describe('CompassMainFolderStorage', function () {
    it('should reject save when the injected userData reports failure', async function () {
      const userData = createFakeUserData({
        write: () => Promise.resolve(false),
      });
      const storage = new CompassMainFolderStorage(
        userData,
        createFakeIpcMain()
      );

      expect(
        await storage.save({ folder: getFolder() }).catch((err) => err)
      ).to.be.an('error');
    });

    it('should reject delete when the injected userData reports failure', async function () {
      const userData = createFakeUserData({
        delete: () => Promise.resolve(false),
      });
      const storage = new CompassMainFolderStorage(
        userData,
        createFakeIpcMain()
      );

      expect(
        await storage.delete({ id: randomUUID() }).catch((err) => err)
      ).to.be.an('error');
    });

    it('should still return the readable folders when readAll reports some errors', async function () {
      // FileUserData's own default options mean a corrupt file never reaches
      // this branch (it logs and drops the entry before errors is populated).
      // A backend that always reports errors on readAll, such as a future
      // Atlas-backed implementation, needs this handled at this layer instead.
      const folder = getFolder();
      const userData = createFakeUserData({
        readAll: () =>
          Promise.resolve({ data: [folder], errors: [new Error('boom')] }),
      });
      const storage = new CompassMainFolderStorage(
        userData,
        createFakeIpcMain()
      );

      expect(await storage.loadAll()).to.deep.equal([folder]);
    });
  });

  describe('CompassMainFolderAssignmentStorage', function () {
    it('should reject save when the injected userData reports failure', async function () {
      const userData = createFakeUserData({
        write: () => Promise.resolve(false),
      });
      const storage = new CompassMainFolderAssignmentStorage(
        userData,
        createFakeIpcMain()
      );

      expect(
        await storage
          .save({ assignment: getFolderAssignment() })
          .catch((err) => err)
      ).to.be.an('error');
    });

    it('should reject delete when the injected userData reports failure', async function () {
      const assignment = getFolderAssignment();
      const userData = createFakeUserData({
        // readOne has to resolve to something truthy for delete() to treat
        // the item as existing and proceed to call delete() at all.
        readOne: () => Promise.resolve(assignment),
        delete: () => Promise.resolve(false),
      });
      const storage = new CompassMainFolderAssignmentStorage(
        userData,
        createFakeIpcMain()
      );

      expect(
        await storage
          .delete({ itemType: assignment.itemType, itemId: assignment.itemId })
          .catch((err) => err)
      ).to.be.an('error');
    });

    it('should not call delete when the item was never assigned', async function () {
      const deleteSpy = Sinon.stub().resolves(true);
      const userData = createFakeUserData({
        readOne: () => Promise.resolve(undefined),
        delete: deleteSpy,
      });
      const storage = new CompassMainFolderAssignmentStorage(
        userData,
        createFakeIpcMain()
      );

      await storage.delete({ itemType: 'connection', itemId: randomUUID() });

      Sinon.assert.notCalled(deleteSpy);
    });

    it('should still return the readable assignments when readAll reports some errors', async function () {
      const assignment = getFolderAssignment();
      const userData = createFakeUserData({
        readAll: () =>
          Promise.resolve({
            data: [assignment],
            errors: [new Error('boom')],
          }),
      });
      const storage = new CompassMainFolderAssignmentStorage(
        userData,
        createFakeIpcMain()
      );

      expect(await storage.loadAll()).to.deep.equal([assignment]);
    });
  });
});

describe('initCompassMainFolderStorage', function () {
  it('should throw when called outside the main process', function () {
    expect(() =>
      initCompassMainFolderStorage(undefined, undefined, true)
    ).to.throw(
      'Cannot initialize CompassFolderStorage outside of main process'
    );
  });
});

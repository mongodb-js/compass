import { expect } from 'chai';
import Sinon from 'sinon';

import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';

import {
  initCompassMainFolderStorage,
  type CompassMainFolderStorage,
  type CompassMainFolderAssignmentStorage,
  type FolderStorageIPCMain,
} from './compass-main-folder-storage';
import type { Folder, FolderAssignment } from './folder-storage';

function getFolderFilePath(tmpDir: string, id: string): string {
  return path.join(tmpDir, 'Folders', `${id}.json`);
}

function getFolderAssignmentFilePath(
  tmpDir: string,
  itemType: FolderAssignment['itemType'],
  itemId: string
): string {
  return path.join(tmpDir, 'FolderAssignments', `${itemType}-${itemId}.json`);
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
      it('should key the file by item type and item id', async function () {
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });

        const filePath = getFolderAssignmentFilePath(
          tmpDir,
          assignment.itemType,
          assignment.itemId
        );
        expect(JSON.parse(await fs.readFile(filePath, 'utf-8'))).to.deep.equal(
          assignment
        );
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

      it('should do nothing if no item id is passed', async function () {
        await folderAssignmentStorage.delete({
          itemType: 'connection',
          itemId: '',
        });
      });
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

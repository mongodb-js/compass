import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Sinon from 'sinon';
import { expect } from 'chai';

import {
  initCompassMainFolderStorage,
  getFolderAssignmentFileId,
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

async function writeFakeFolderAssignment(
  tmpDir: string,
  assignment: Record<string, unknown>
) {
  const filePath = getFolderAssignmentFilePath(
    tmpDir,
    assignment.itemType as FolderAssignment['itemType'],
    assignment.itemId as string
  );
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(assignment));
}

async function readFolderAssignmentFile(
  tmpDir: string,
  itemType: FolderAssignment['itemType'],
  itemId: string
) {
  return JSON.parse(
    await fs.readFile(
      getFolderAssignmentFilePath(tmpDir, itemType, itemId),
      'utf-8'
    )
  );
}

function captureLogMessages() {
  const messages: string[] = [];
  const onLog = ({ line }: { line: string }) => {
    messages.push((JSON.parse(line) as { msg: string }).msg);
  };
  process.on('compass:log', onLog);
  return {
    messages,
    stop: () => {
      process.off('compass:log', onLog);
    },
  };
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

      it('should keep a folder whose lastModifiedAt cannot be read', async function () {
        // A date this version cannot parse, for example one written in a
        // format a later version introduced, must not cost us the folder.
        const folder = getFolder();
        await writeFakeFolder(tmpDir, {
          ...folder,
          lastModifiedAt: 'whenever',
        });

        const folders = await folderStorage.loadAll();
        expect(folders).to.have.lengthOf(1);
        expect(folders[0].id).to.equal(folder.id);
        expect(folders[0].lastModifiedAt).to.equal(undefined);
      });

      it('should ignore the temporary files write-file-atomic leaves behind', async function () {
        // write-file-atomic writes a record to a temporary file next to it
        // before renaming it into place, so a crash can leave a complete copy
        // of the record behind. Reading it would load the folder twice.
        const folder = getFolder();
        await folderStorage.save({ folder });
        await fs.writeFile(
          path.join(tmpDir, 'Folders', `${folder.id}.json.123456789`),
          JSON.stringify(folder)
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

      it('should keep fields it does not know about', async function () {
        // Renaming a folder written by a newer version must not drop the
        // fields this version does not know about: the caller only passes the
        // folder it loaded, and it loaded the fields it understands.
        const folder = getFolder({ name: 'Production' });
        await writeFakeFolder(tmpDir, { ...folder, parentId: 'some-parent' });

        await folderStorage.save({ folder: { ...folder, name: 'Renamed' } });

        expect(await readFolderFile(tmpDir, folder.id)).to.deep.equal({
          id: folder.id,
          name: 'Renamed',
          parentId: 'some-parent',
        });
      });

      it('should merge into what the previous save left, not into what it read', async function () {
        // Two saves for the same folder at once. Each merges into the record as
        // it was when it read it, so without ordering both would read the
        // folder as it was before either of them, and the last one to write
        // would drop the field the other added.
        const folder = getFolder();
        await folderStorage.save({ folder });

        await Promise.all([
          folderStorage.save({
            folder: { ...folder, parentId: 'some-parent' } as unknown as Folder,
          }),
          folderStorage.save({ folder: { ...folder, name: 'Renamed' } }),
        ]);

        const [loaded] = await folderStorage.loadAll();
        expect(loaded.name).to.equal('Renamed');
        expect(loaded).to.have.property('parentId', 'some-parent');
      });

      it('should clear a field the caller passes as undefined, unlike one it omits', async function () {
        // A field this call does not mention is carried over from the stored
        // folder, because the schemas are loose and a version may not know
        // about every field. A field passed explicitly as undefined is a
        // different thing: the caller does know about it and is clearing it.
        // (JSON drops a key whose value is undefined, so the cleared field is
        // simply absent from the file, same as it never having been written.)
        const folder = getFolder();
        await writeFakeFolder(tmpDir, { ...folder, parentId: 'some-parent' });

        await folderStorage.save({
          folder: { ...folder, parentId: undefined } as unknown as Folder,
        });

        const stored = await readFolderFile(tmpDir, folder.id);
        expect(stored).not.to.have.property('parentId');
        expect(stored).to.deep.equal({ id: folder.id, name: folder.name });
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

      it('should not let a save in flight when a delete starts recreate the folder', async function () {
        // A save begun just before the delete has already read the folder by
        // the time the delete runs. Without serializing the two, its write
        // would land after the delete and bring the folder back.
        const folder = getFolder();
        await folderStorage.save({ folder });

        await Promise.all([
          folderStorage.save({ folder: { ...folder, name: 'Renamed' } }),
          folderStorage.delete({ id: folder.id }),
        ]);

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

      it('should ignore the temporary files write-file-atomic leaves behind', async function () {
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });
        await fs.writeFile(
          path.join(
            tmpDir,
            'FolderAssignments',
            `${getFolderAssignmentFileId(assignment)}.json.123456789`
          ),
          JSON.stringify(assignment)
        );

        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([
          assignment,
        ]);
      });

      it('should ignore an assignment for an item type it does not know', async function () {
        // A later version can file another kind of item in a folder. This
        // version cannot act on that record, but it is not corrupt, so it must
        // not be reported as data we dropped either.
        const logged = captureLogMessages();

        try {
          await writeFakeFolderAssignment(tmpDir, {
            itemType: 'query',
            itemId: randomUUID(),
            folderId: randomUUID(),
          });

          expect(await folderAssignmentStorage.loadAll()).to.deep.equal([]);
          expect(logged.messages).to.deep.equal([]);
        } finally {
          logged.stop();
        }
      });

      it('should leave an assignment for an unknown item type untouched', async function () {
        const unknown = {
          itemType: 'query',
          itemId: randomUUID(),
          folderId: randomUUID(),
          order: 3,
        };
        await writeFakeFolderAssignment(tmpDir, unknown);
        const filePath = getFolderAssignmentFilePath(
          tmpDir,
          unknown.itemType as FolderAssignment['itemType'],
          unknown.itemId
        );

        // Saving a connection assignment, and reading everything back, must
        // not rewrite or drop a record this version does not understand.
        await folderAssignmentStorage.save({
          assignment: getFolderAssignment(),
        });
        await folderAssignmentStorage.loadAll();

        expect(JSON.parse(await fs.readFile(filePath, 'utf-8'))).to.deep.equal(
          unknown
        );
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

      it('should keep fields it does not know about', async function () {
        const assignment = getFolderAssignment();
        await writeFakeFolderAssignment(tmpDir, { ...assignment, order: 3 });

        await folderAssignmentStorage.save({ assignment });

        expect(
          await readFolderAssignmentFile(
            tmpDir,
            assignment.itemType,
            assignment.itemId
          )
        ).to.deep.equal({ ...assignment, order: 3 });
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

      it('should not let a save in flight when a delete starts recreate the assignment', async function () {
        const assignment = getFolderAssignment();
        await folderAssignmentStorage.save({ assignment });

        await Promise.all([
          folderAssignmentStorage.save({
            assignment: { ...assignment, folderId: randomUUID() },
          }),
          folderAssignmentStorage.delete({
            itemType: assignment.itemType,
            itemId: assignment.itemId,
          }),
        ]);

        expect(await folderAssignmentStorage.loadAll()).to.deep.equal([]);
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

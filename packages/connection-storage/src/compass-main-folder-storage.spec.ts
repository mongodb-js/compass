import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import Sinon from 'sinon';
import { expect } from 'chai';
import { type IUserData } from '@mongodb-js/compass-user-data';

import {
  initCompassMainFolderStorage,
  CompassMainFolderStorage,
  type FolderStorageIPCMain,
} from './compass-main-folder-storage';
import type { Folder, FolderOrganization } from './folder-storage';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createFakeUserData(
  overrides: {
    write?: () => Promise<boolean>;
    readOne?: () => Promise<unknown>;
  } = {}
  // The storage class is generic over the module's own (unexported) zod
  // schema, which this fake has no way to name from outside the module --
  // `any` here stands in for "whatever schema the class under test expects".
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): IUserData<any> {
  return {
    write: overrides.write ?? (() => Promise.resolve(true)),
    readOne: overrides.readOne ?? (() => Promise.resolve(undefined)),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as IUserData<any>;
}

function createFakeIpcMain(): FolderStorageIPCMain {
  return { createHandle: Sinon.stub() };
}

function getFolderOrganizationFilePath(tmpDir: string): string {
  return path.join(tmpDir, 'Folders', 'folder-organization.json');
}

async function writeFakeFolderOrganization(
  tmpDir: string,
  folderOrganization: Record<string, unknown>
) {
  const filePath = getFolderOrganizationFilePath(tmpDir);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(folderOrganization));
}

async function readFolderOrganizationFile(tmpDir: string) {
  return JSON.parse(
    await fs.readFile(getFolderOrganizationFilePath(tmpDir), 'utf-8')
  );
}

function getFolder(props: Partial<Folder> = {}): Folder {
  return { id: randomUUID(), name: 'My folder', ...props };
}

describe('FolderStorage', function () {
  let folderStorage: CompassMainFolderStorage;
  let ipcMain: FolderStorageIPCMain;
  let tmpDir: string;

  beforeEach(async function () {
    ipcMain = { createHandle: Sinon.stub() };
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'folder-storage-tests'));
    folderStorage = initCompassMainFolderStorage(tmpDir, ipcMain, true);
  });

  afterEach(async function () {
    await fs.rm(tmpDir, { recursive: true, force: true });
    Sinon.restore();
  });

  it('should expose itself over IPC', function () {
    const channels = (ipcMain.createHandle as Sinon.SinonStub)
      .getCalls()
      .map((call) => call.args[0]);
    expect(channels).to.deep.equal(['FolderStorage']);
  });

  describe('load', function () {
    it('should return an empty folder organization when nothing is saved', async function () {
      expect(await folderStorage.load()).to.deep.equal({
        folders: [],
        assignments: {},
      });
    });

    it('should return the saved folder organization', async function () {
      const folderOrganization: FolderOrganization = {
        folders: [getFolder()],
        assignments: { 'connection-1': 'folder-1' },
      };
      await folderStorage.save({ folderOrganization });
      expect(await folderStorage.load()).to.deep.equal(folderOrganization);
    });

    it('should convert a folder lastModifiedAt to a date', async function () {
      const folder = getFolder();
      await writeFakeFolderOrganization(tmpDir, {
        folders: [{ ...folder, lastModifiedAt: '2026-01-05T13:51:27.585Z' }],
        assignments: {},
      });
      const { folders } = await folderStorage.load();
      expect(folders[0].lastModifiedAt).to.be.a('date');
      expect(folders[0].lastModifiedAt?.toISOString()).to.equal(
        '2026-01-05T13:51:27.585Z'
      );
    });

    it('should preserve fields it does not know about', async function () {
      // Older versions must not strip data written by newer ones, otherwise
      // adding a folder parent reference later would lose it on a downgrade.
      const folder = getFolder();
      await writeFakeFolderOrganization(tmpDir, {
        folders: [{ ...folder, parentId: 'some-parent' }],
        assignments: {},
        futureTopLevelField: 'kept',
      });
      const folderOrganization = await folderStorage.load();
      expect(folderOrganization.folders[0]).to.have.property(
        'parentId',
        'some-parent'
      );
      expect(folderOrganization).to.have.property(
        'futureTopLevelField',
        'kept'
      );
    });

    it('should return an empty folder organization if the file is corrupt', async function () {
      // There's one file for the whole folder organization, so a corrupt file
      // costs everything in it. That's accepted here rather than
      // special-cased: partial recovery would only leave a confusing,
      // half-restored state.
      await fs.mkdir(path.join(tmpDir, 'Folders'), { recursive: true });
      await fs.writeFile(getFolderOrganizationFilePath(tmpDir), 'not json');

      expect(await folderStorage.load()).to.deep.equal({
        folders: [],
        assignments: {},
      });
    });
  });

  describe('save', function () {
    it('should write a single file regardless of content', async function () {
      const folderOrganization: FolderOrganization = {
        folders: [getFolder(), getFolder()],
        assignments: { 'connection-1': 'folder-1' },
      };
      await folderStorage.save({ folderOrganization });

      expect(await fs.readdir(path.join(tmpDir, 'Folders'))).to.deep.equal([
        'folder-organization.json',
      ]);
      expect(await readFolderOrganizationFile(tmpDir)).to.deep.equal(
        folderOrganization
      );
    });

    it('should replace the whole folder organization, not merge into it', async function () {
      await folderStorage.save({
        folderOrganization: {
          folders: [getFolder()],
          assignments: { 'connection-1': 'folder-1' },
        },
      });

      const next: FolderOrganization = { folders: [], assignments: {} };
      await folderStorage.save({ folderOrganization: next });

      expect(await folderStorage.load()).to.deep.equal(next);
    });

    it('should keep a connection mapped to at most one folder', async function () {
      // assignments is a plain map, so re-assigning a connection id
      // overwrites its previous folder rather than adding a second entry.
      await folderStorage.save({
        folderOrganization: {
          folders: [],
          assignments: { 'connection-1': 'folder-1' },
        },
      });
      await folderStorage.save({
        folderOrganization: {
          folders: [],
          assignments: { 'connection-1': 'folder-2' },
        },
      });

      expect(await folderStorage.load()).to.deep.equal({
        folders: [],
        assignments: { 'connection-1': 'folder-2' },
      });
    });
  });
});

describe('dependency injection', function () {
  it('should reject save when the injected userData reports failure', async function () {
    const userData = createFakeUserData({
      write: () => Promise.resolve(false),
    });
    const storage = new CompassMainFolderStorage(userData, createFakeIpcMain());

    expect(
      await storage
        .save({ folderOrganization: { folders: [], assignments: {} } })
        .catch((err) => err)
    ).to.be.an('error');
  });

  it('should return an empty folder organization when the injected userData rejects', async function () {
    const userData = createFakeUserData({
      readOne: () => Promise.reject(new Error('boom')),
    });
    const storage = new CompassMainFolderStorage(userData, createFakeIpcMain());

    expect(await storage.load()).to.deep.equal({
      folders: [],
      assignments: {},
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

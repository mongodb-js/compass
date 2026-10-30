import { type HadronIpcMain, ipcMain } from '@mongodb-js/hadron-ipc';
import { createLogger } from '@mongodb-js/compass-logging';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import { FileUserData, z } from '@mongodb-js/compass-user-data';
import type {
  Folder,
  FolderAssignment,
  FolderStorage,
  FolderAssignmentStorage,
} from './folder-storage';
import { RecordWriteQueue } from './record-write-queue';

const { log, mongoLogId } = createLogger('FOLDER-STORAGE');

export type FolderStorageIPCMain = Pick<HadronIpcMain, 'createHandle'>;

// Both schemas are loose so that fields added by a later version (for example
// a folder's parent reference) survive a read/write round trip here.
const FolderSchema: z.Schema<Folder> = z
  .object({
    id: z.uuid(),
    name: z.string(),
    // A date this version cannot make sense of, for example one written in a
    // format a later version introduced, must not cost us the whole folder:
    // falling back to no date only means the folder sorts as the oldest one.
    lastModifiedAt: z.coerce
      .date()
      .optional()
      .catch(undefined)
      .transform((x) => (x !== undefined ? new Date(x) : x)),
  })
  .loose();

// An assignment can name an item kind this version does not know, written by a
// later version that added one. Such a record is not corrupt, so it has to
// parse: reporting it as data we dropped would raise an error on every launch
// of a downgraded Compass about a file that is perfectly fine. It also has to
// stay on disk untouched, for the version that understands it.
type StoredFolderAssignment = Omit<FolderAssignment, 'itemType'> & {
  itemType: string;
};

const FolderAssignmentSchema: z.Schema<StoredFolderAssignment> = z
  .object({
    itemType: z.string(),
    itemId: z.string(),
    folderId: z.uuid(),
  })
  .loose();

function isAssignmentForKnownItemType(
  stored: StoredFolderAssignment
): stored is FolderAssignment {
  return stored.itemType === 'connection';
}

/**
 * An assignment is stored in a file named after the item it points at, so ids
 * from different item kinds can never collide.
 */
export function getFolderAssignmentFileId({
  itemType,
  itemId,
}: Pick<FolderAssignment, 'itemType' | 'itemId'>): string {
  return `${itemType}-${itemId}`;
}

class CompassMainFolderStorage implements FolderStorage {
  private readonly userData: FileUserData<typeof FolderSchema>;
  private readonly ipcMain: FolderStorageIPCMain;
  private readonly saveQueue = new RecordWriteQueue();

  constructor(ipcMain: FolderStorageIPCMain, basePath?: string) {
    this.ipcMain = ipcMain;
    this.userData = new FileUserData(FolderSchema, 'Folders', { basePath });
    this.ipcMain.createHandle<FolderStorage>('FolderStorage', this, [
      'loadAll',
      'save',
      'delete',
    ]);
  }

  async loadAll({ signal }: { signal?: AbortSignal } = {}): Promise<Folder[]> {
    throwIfAborted(signal);
    try {
      // ignoreErrors: false collects the files that could not be read instead
      // of swallowing them, so we can report how much data was dropped.
      const { data, errors } = await this.userData.readAll({
        ignoreErrors: false,
      });
      if (errors.length > 0) {
        log.error(
          mongoLogId(1_001_000_467),
          'Folder Storage',
          'Skipped folders that could not be read',
          { count: errors.length }
        );
      }
      return data;
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_461),
        'Folder Storage',
        'Failed to load folders',
        { message: (err as Error).message }
      );
      return [];
    }
  }

  async save({
    folder,
    signal,
  }: {
    folder: Folder;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    try {
      await this.saveQueue.run(folder.id, async () => {
        // Merge into the stored folder rather than replacing it: the schemas
        // are loose so that a newer Compass can add fields, and a version that
        // does not know about them still has to carry them through a save.
        // A key this call omits keeps the stored value; a key it passes as
        // undefined overwrites the stored value with undefined, same as
        // InMemoryFolderStorage and FileUserData.updateAttributes.
        const stored = await this.userData.readOne(folder.id, {
          ignoreErrors: true,
          ignoreMissing: true,
        });
        await this.userData.write(folder.id, { ...stored, ...folder });
      });
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_462),
        'Folder Storage',
        'Failed to save folder',
        { message: (err as Error).message }
      );
      throw err;
    }
  }

  async delete({
    id,
    signal,
  }: {
    id: string;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    if (!id) {
      return;
    }
    try {
      // Goes through the same queue as save: a save already reading this
      // record when the delete runs would otherwise write its merged result
      // after the delete, recreating the record it just removed.
      await this.saveQueue.run(id, () => this.userData.delete(id));
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_463),
        'Folder Storage',
        'Failed to delete folder',
        { message: (err as Error).message }
      );
      throw err;
    }
  }
}

class CompassMainFolderAssignmentStorage implements FolderAssignmentStorage {
  private readonly userData: FileUserData<typeof FolderAssignmentSchema>;
  private readonly ipcMain: FolderStorageIPCMain;
  private readonly saveQueue = new RecordWriteQueue();

  constructor(ipcMain: FolderStorageIPCMain, basePath?: string) {
    this.ipcMain = ipcMain;
    this.userData = new FileUserData(
      FolderAssignmentSchema,
      'FolderAssignments',
      { basePath }
    );
    this.ipcMain.createHandle<FolderAssignmentStorage>(
      'FolderAssignmentStorage',
      this,
      ['loadAll', 'save', 'delete']
    );
  }

  async loadAll({ signal }: { signal?: AbortSignal } = {}): Promise<
    FolderAssignment[]
  > {
    throwIfAborted(signal);
    try {
      const { data, errors } = await this.userData.readAll({
        ignoreErrors: false,
      });
      if (errors.length > 0) {
        log.error(
          mongoLogId(1_001_000_468),
          'Folder Storage',
          'Skipped folder assignments that could not be read',
          { count: errors.length }
        );
      }
      // Assignments for other kinds of items are left on disk rather than
      // returned or reported: this version cannot act on them, and removing
      // them is not its call to make.
      return data.filter(isAssignmentForKnownItemType);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_464),
        'Folder Storage',
        'Failed to load folder assignments',
        { message: (err as Error).message }
      );
      return [];
    }
  }

  async save({
    assignment,
    signal,
  }: {
    assignment: FolderAssignment;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    try {
      const fileId = getFolderAssignmentFileId(assignment);
      await this.saveQueue.run(fileId, async () => {
        // See CompassMainFolderStorage.save: a key this call omits keeps the
        // stored value, a key it passes as undefined clears it.
        const stored = await this.userData.readOne(fileId, {
          ignoreErrors: true,
          ignoreMissing: true,
        });
        await this.userData.write(fileId, { ...stored, ...assignment });
      });
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_465),
        'Folder Storage',
        'Failed to save folder assignment',
        { message: (err as Error).message }
      );
      throw err;
    }
  }

  async delete({
    itemType,
    itemId,
    signal,
  }: {
    itemType: FolderAssignment['itemType'];
    itemId: string;
    signal?: AbortSignal;
  }): Promise<void> {
    throwIfAborted(signal);
    if (!itemId) {
      return;
    }
    try {
      const fileId = getFolderAssignmentFileId({ itemType, itemId });
      // Goes through the same queue as save; see CompassMainFolderStorage.delete.
      await this.saveQueue.run(fileId, () => this.userData.delete(fileId));
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_466),
        'Folder Storage',
        'Failed to delete folder assignment',
        { message: (err as Error).message }
      );
      throw err;
    }
  }
}

export type { CompassMainFolderStorage, CompassMainFolderAssignmentStorage };

let mainFolderStorage: CompassMainFolderStorage | null = null;
let mainFolderAssignmentStorage: CompassMainFolderAssignmentStorage | null =
  null;

export const initCompassMainFolderStorage = (
  basePath?: string,
  __TEST_IPC_MAIN?: FolderStorageIPCMain,
  __TEST_IGNORE_SINGLETON?: boolean
): {
  folders: CompassMainFolderStorage;
  assignments: CompassMainFolderAssignmentStorage;
} => {
  let ipcMainToBeUsed: FolderStorageIPCMain | undefined = ipcMain;
  if (process.env.NODE_ENV === 'test' && __TEST_IPC_MAIN) {
    ipcMainToBeUsed = __TEST_IPC_MAIN;
  }

  if (!ipcMainToBeUsed) {
    throw new Error(
      'Cannot initialize CompassFolderStorage outside of main process'
    );
  }

  if (!mainFolderStorage || __TEST_IGNORE_SINGLETON) {
    mainFolderStorage = new CompassMainFolderStorage(ipcMainToBeUsed, basePath);
  }

  if (!mainFolderAssignmentStorage || __TEST_IGNORE_SINGLETON) {
    mainFolderAssignmentStorage = new CompassMainFolderAssignmentStorage(
      ipcMainToBeUsed,
      basePath
    );
  }

  return {
    folders: mainFolderStorage,
    assignments: mainFolderAssignmentStorage,
  };
};

export const getCompassMainFolderStorage = (): CompassMainFolderStorage => {
  if (!mainFolderStorage) {
    throw new Error(
      'FolderStorage not initialized, did you forget to call initCompassMainFolderStorage'
    );
  }
  return mainFolderStorage;
};

export const getCompassMainFolderAssignmentStorage =
  (): CompassMainFolderAssignmentStorage => {
    if (!mainFolderAssignmentStorage) {
      throw new Error(
        'FolderAssignmentStorage not initialized, did you forget to call initCompassMainFolderStorage'
      );
    }
    return mainFolderAssignmentStorage;
  };

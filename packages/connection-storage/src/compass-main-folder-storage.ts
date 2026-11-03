import { UUID } from 'bson';
import { type HadronIpcMain, ipcMain } from '@mongodb-js/hadron-ipc';
import { createLogger } from '@mongodb-js/compass-logging';
import { throwIfAborted } from '@mongodb-js/compass-utils';
import { FileUserData, z } from '@mongodb-js/compass-user-data';
import type { IUserData } from '@mongodb-js/compass-user-data';
import type {
  Folder,
  FolderAssignment,
  FolderStorage,
  FolderAssignmentStorage,
} from './folder-storage';

const { log, mongoLogId } = createLogger('FOLDER-STORAGE');

export type FolderStorageIPCMain = Pick<HadronIpcMain, 'createHandle'>;

// IUserData's write/delete/readAll don't take a signal, so a write or delete
// already in flight can't be interrupted -- the pre-write throwIfAborted below
// only rejects a call that was cancelled before it started. The post-write
// throwIfAborted doesn't undo the write either, but it does mean a save
// cancelled mid-flight still rejects instead of silently resolving as if it
// had succeeded.

// Both schemas are loose so that fields added by a later version (for example
// a folder's parent reference) survive a read/write round trip here.
const FolderSchema: z.Schema<Folder> = z
  .object({
    id: z.uuid(),
    name: z.string(),
    lastModifiedAt: z.coerce
      .date()
      .optional()
      .transform((x) => (x !== undefined ? new Date(x) : x)),
  })
  .loose();

// The persisted shape of an assignment. `id` is a storage-only identifier:
// callers identify an assignment by (itemType, itemId), never by this id, so
// it is generated here and never exposed through the FolderAssignmentStorage
// interface. It exists so the record can be found and overwritten in place
// instead of being addressed by a filename derived from (itemType, itemId) --
// that composite key isn't a well-formed id on the web backend, where every
// stored record is expected to have a UUID id.
const FolderAssignmentRecordSchema = z
  .object({
    id: z.uuid(),
    itemType: z.literal('connection'),
    itemId: z.string(),
    folderId: z.uuid(),
  })
  .loose();
type FolderAssignmentRecord = z.output<typeof FolderAssignmentRecordSchema>;

class CompassMainFolderStorage implements FolderStorage {
  private readonly userData: IUserData<typeof FolderSchema>;

  constructor(
    userData: IUserData<typeof FolderSchema>,
    ipcMain: FolderStorageIPCMain
  ) {
    this.userData = userData;
    ipcMain.createHandle<FolderStorage>('FolderStorage', this, [
      'loadAll',
      'save',
      'delete',
    ]);
  }

  async loadAll({ signal }: { signal?: AbortSignal } = {}): Promise<Folder[]> {
    throwIfAborted(signal);
    try {
      const { data, errors } = await this.userData.readAll();
      logReadErrors(errors, 'Failed to read some folders');
      return data;
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_453),
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
      const ok = await this.userData.write(folder.id, folder);
      // write() reports file system / network failures by returning false
      // rather than throwing, so a failed save has to be checked explicitly
      // or it looks identical to a successful one to the caller.
      if (!ok) {
        throw new Error('Failed to write folder');
      }
      throwIfAborted(signal);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_454),
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
      const ok = await this.userData.delete(id);
      if (!ok) {
        throw new Error('Failed to delete folder');
      }
      throwIfAborted(signal);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_455),
        'Folder Storage',
        'Failed to delete folder',
        { message: (err as Error).message }
      );
      throw err;
    }
  }
}

class CompassMainFolderAssignmentStorage implements FolderAssignmentStorage {
  private readonly userData: IUserData<typeof FolderAssignmentRecordSchema>;

  constructor(
    userData: IUserData<typeof FolderAssignmentRecordSchema>,
    ipcMain: FolderStorageIPCMain
  ) {
    this.userData = userData;
    ipcMain.createHandle<FolderAssignmentStorage>(
      'FolderAssignmentStorage',
      this,
      ['loadAll', 'save', 'delete']
    );
  }

  /**
   * An assignment's identity, as far as every caller is concerned, is
   * (itemType, itemId) -- there's at most one record per item. Since the
   * storage id is now an opaque UUID instead of being derived from that pair,
   * finding the record that corresponds to an item means scanning for it.
   * Assignment counts are bounded by the number of saved connections, so this
   * is a small, infrequent scan, not a hot path.
   */
  private async findRecord(
    itemType: FolderAssignment['itemType'],
    itemId: string
  ): Promise<FolderAssignmentRecord | undefined> {
    const { data, errors } = await this.userData.readAll();
    logReadErrors(errors, 'Failed to read some folder assignments');
    return data.find(
      (record) => record.itemType === itemType && record.itemId === itemId
    );
  }

  async loadAll({ signal }: { signal?: AbortSignal } = {}): Promise<
    FolderAssignment[]
  > {
    throwIfAborted(signal);
    try {
      const { data, errors } = await this.userData.readAll();
      logReadErrors(errors, 'Failed to read some folder assignments');
      // The storage id is an implementation detail of this class, not part of
      // the FolderAssignmentStorage contract -- callers identify an
      // assignment by (itemType, itemId), so it's stripped before returning.
      return data.map(toFolderAssignment);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_456),
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
      const existing = await this.findRecord(
        assignment.itemType,
        assignment.itemId
      );
      const id = existing?.id ?? new UUID().toString();
      const ok = await this.userData.write(id, { id, ...assignment });
      if (!ok) {
        throw new Error('Failed to write folder assignment');
      }
      throwIfAborted(signal);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_457),
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
      const existing = await this.findRecord(itemType, itemId);
      if (!existing) {
        return;
      }
      const ok = await this.userData.delete(existing.id);
      if (!ok) {
        throw new Error('Failed to delete folder assignment');
      }
      throwIfAborted(signal);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_458),
        'Folder Storage',
        'Failed to delete folder assignment',
        { message: (err as Error).message }
      );
      throw err;
    }
  }
}

function logReadErrors(errors: Error[], message: string): void {
  if (errors.length === 0) {
    return;
  }
  log.error(mongoLogId(1_001_000_459), 'Folder Storage', message, {
    count: errors.length,
    messages: errors.map((err) => err.message),
  });
}

function toFolderAssignment({
  itemType,
  itemId,
  folderId,
}: FolderAssignmentRecord): FolderAssignment {
  return { itemType, itemId, folderId };
}

// Exported as values, not just types, so the injected-userData constructor can
// be exercised directly in tests without going through the IPC-registering
// singleton factory below.
export { CompassMainFolderStorage, CompassMainFolderAssignmentStorage };

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
    mainFolderStorage = new CompassMainFolderStorage(
      new FileUserData(FolderSchema, 'Folders', { basePath }),
      ipcMainToBeUsed
    );
  }

  if (!mainFolderAssignmentStorage || __TEST_IGNORE_SINGLETON) {
    mainFolderAssignmentStorage = new CompassMainFolderAssignmentStorage(
      new FileUserData(FolderAssignmentRecordSchema, 'FolderAssignments', {
        basePath,
      }),
      ipcMainToBeUsed
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

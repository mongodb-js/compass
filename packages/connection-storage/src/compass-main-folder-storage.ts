import { createHash } from 'node:crypto';
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

const FolderAssignmentSchema: z.Schema<FolderAssignment> = z
  .object({
    itemType: z.literal('connection'),
    itemId: z.string(),
    folderId: z.uuid(),
  })
  .loose();

/**
 * A fixed namespace for deriving folder assignment storage ids. The value
 * itself doesn't matter -- it only has to stay constant across runs, since
 * changing it would make every existing assignment unrecoverable by id --
 * so it's just a UUID generated once and hardcoded here.
 */
const FOLDER_ASSIGNMENT_ID_NAMESPACE = '6f2c9b61-6e0b-4f0b-8f0a-6ef1d9d9a7ab';

/**
 * Derives a UUID (v5, RFC 4122 -- namespace + name, SHA-1) from
 * (itemType, itemId), so the storage id is both a well-formed UUID and fully
 * determined by the item it belongs to. That means save() and delete() can
 * address the record directly, with no lookup needed to find it first: two
 * concurrent saves for the same item compute the same id and race on a single
 * write to one file, rather than each writing a different file for what
 * should be one record.
 */
function getFolderAssignmentId(
  itemType: FolderAssignment['itemType'],
  itemId: string
): string {
  const namespaceBytes = Buffer.from(
    FOLDER_ASSIGNMENT_ID_NAMESPACE.replace(/-/g, ''),
    'hex'
  );
  const nameBytes = Buffer.from(`${itemType}:${itemId}`, 'utf8');
  const hash = createHash('sha1')
    .update(namespaceBytes)
    .update(nameBytes)
    .digest();
  const bytes = Buffer.from(hash.subarray(0, 16));
  bytes[6] = (bytes[6] & 0x0f) | 0x50; // version 5
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // RFC 4122 variant
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

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
  private readonly userData: IUserData<typeof FolderAssignmentSchema>;

  constructor(
    userData: IUserData<typeof FolderAssignmentSchema>,
    ipcMain: FolderStorageIPCMain
  ) {
    this.userData = userData;
    ipcMain.createHandle<FolderAssignmentStorage>(
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
      const { data, errors } = await this.userData.readAll();
      logReadErrors(errors, 'Failed to read some folder assignments');
      return data;
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
      const id = getFolderAssignmentId(assignment.itemType, assignment.itemId);
      const ok = await this.userData.write(id, assignment);
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
      const id = getFolderAssignmentId(itemType, itemId);
      // The id is derived, not looked up, so a delete for an item that was
      // never assigned computes a real id pointing at a file that was never
      // written. Check first so that case stays a no-op instead of being
      // reported as a failed delete.
      const existing = await this.userData.readOne(id, {
        ignoreErrors: true,
      });
      if (!existing) {
        return;
      }
      const ok = await this.userData.delete(id);
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
      new FileUserData(FolderAssignmentSchema, 'FolderAssignments', {
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

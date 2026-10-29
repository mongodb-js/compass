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

const { log, mongoLogId } = createLogger('FOLDER-STORAGE');

export type FolderStorageIPCMain = Pick<HadronIpcMain, 'createHandle'>;

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
      return (await this.userData.readAll()).data;
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_445),
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
      await this.userData.write(folder.id, folder);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_446),
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
      await this.userData.delete(id);
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_447),
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

  constructor(ipcMain: FolderStorageIPCMain, basePath?: string) {
    this.ipcMain = ipcMain;
    this.userData = new FileUserData(
      FolderAssignmentSchema,
      'FolderAssignments',
      {
        basePath,
      }
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
      return (await this.userData.readAll()).data;
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_448),
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
      await this.userData.write(
        getFolderAssignmentFileId(assignment),
        assignment
      );
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_449),
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
      await this.userData.delete(
        getFolderAssignmentFileId({ itemType, itemId })
      );
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_450),
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

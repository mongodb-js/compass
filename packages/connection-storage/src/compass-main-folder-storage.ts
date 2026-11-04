import { type HadronIpcMain, ipcMain } from '@mongodb-js/hadron-ipc';
import { createLogger } from '@mongodb-js/compass-logging';
import { FileUserData, z } from '@mongodb-js/compass-user-data';
import type { IUserData } from '@mongodb-js/compass-user-data';
import type { FolderOrganization, FolderStorage } from './folder-storage';

const { log, mongoLogId } = createLogger('FOLDER-STORAGE');

export type FolderStorageIPCMain = Pick<HadronIpcMain, 'createHandle'>;

const FolderSchema = z
  .object({
    id: z.uuid(),
    name: z.string(),
    lastModifiedAt: z.coerce
      .date()
      .optional()
      .transform((x) => (x !== undefined ? new Date(x) : x)),
  })
  .loose();

const FolderOrganizationSchema: z.Schema<FolderOrganization> = z
  .object({
    folders: z.array(FolderSchema),
    assignments: z.record(z.string(), z.string()),
  })
  .loose();

// The organization document is a singleton: there's one per user, so it's
// always read and written under this same fixed id rather than one per
// folder.
const ORGANIZATION_ID = 'organization';

const EMPTY_ORGANIZATION: FolderOrganization = { folders: [], assignments: {} };

class CompassMainFolderStorage implements FolderStorage {
  private readonly userData: IUserData<typeof FolderOrganizationSchema>;

  constructor(
    userData: IUserData<typeof FolderOrganizationSchema>,
    ipcMain: FolderStorageIPCMain
  ) {
    this.userData = userData;
    ipcMain.createHandle<FolderStorage>('FolderStorage', this, [
      'load',
      'save',
    ]);
  }

  async load(): Promise<FolderOrganization> {
    try {
      return (
        (await this.userData.readOne(ORGANIZATION_ID)) ?? EMPTY_ORGANIZATION
      );
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_453),
        'Folder Storage',
        'Failed to load folder organization',
        { message: (err as Error).message }
      );
      return EMPTY_ORGANIZATION;
    }
  }

  async save({
    organization,
  }: {
    organization: FolderOrganization;
  }): Promise<void> {
    try {
      const ok = await this.userData.write(ORGANIZATION_ID, organization);
      // write() reports file system / network failures by returning false
      // rather than throwing, so a failed save has to be checked explicitly
      // or it looks identical to a successful one to the caller.
      if (!ok) {
        throw new Error('Failed to write folder organization');
      }
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_454),
        'Folder Storage',
        'Failed to save folder organization',
        { message: (err as Error).message }
      );
      throw err;
    }
  }
}

// Exported as a value, not just a type, so the injected-userData constructor
// can be exercised directly in tests without going through the
// IPC-registering singleton factory below.
export { CompassMainFolderStorage };

let mainFolderStorage: CompassMainFolderStorage | null = null;

export const initCompassMainFolderStorage = (
  basePath?: string,
  __TEST_IPC_MAIN?: FolderStorageIPCMain,
  __TEST_IGNORE_SINGLETON?: boolean
): CompassMainFolderStorage => {
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
      new FileUserData(FolderOrganizationSchema, 'Folders', { basePath }),
      ipcMainToBeUsed
    );
  }

  return mainFolderStorage;
};

export const getCompassMainFolderStorage = (): CompassMainFolderStorage => {
  if (!mainFolderStorage) {
    throw new Error(
      'FolderStorage not initialized, did you forget to call initCompassMainFolderStorage'
    );
  }
  return mainFolderStorage;
};

import {
  UserData,
  createBridgeUserDataFetch,
  z,
  type AuthenticatedFetch,
} from '@mongodb-js/compass-user-data';

export class HistoryStorage {
  fileName = 'shell-history';
  userData;

  /** `fetch` defaults to the preload script's bridge to main */
  constructor(fetch: AuthenticatedFetch = createBridgeUserDataFetch()) {
    this.userData = new UserData(z.string().array(), 'ShellHistory', {
      kind: 'local',
      fetch,
    });
  }

  /**
   * Saves the history to disk, it creates the directory and the file if
   * not existing and replaces the file content.
   *
   * @param {string[]} history - An array of history entries sorted from
   * newest to oldest.
   */
  async save(history: string[]) {
    await this.userData.write(this.fileName, history);
  }

  /**
   * Loads the history from disk. Returns an empty array if the file does
   * not exist or cannot be accessed.
   *
   * @returns {Promise<string[]>} An array of history entries sorted from
   * newest to oldest.
   */
  async load(): Promise<string[]> {
    return (await this.userData.readOne(this.fileName)) ?? [];
  }
}

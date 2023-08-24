import { getAppName } from '@mongodb-js/compass-utils';
import { UserData } from '@mongodb-js/compass-user-data';

export class HistoryStorage {
  fileName = 'shell-history.json';
  userData;

  constructor(basePath) {
    this.userData = new UserData({
      // Todo: https://jira.mongodb.org/browse/COMPASS-7080
      subdir: getAppName() ?? '',
      basePath,
    });
  }

  /**
   * Saves the history to disk, it creates the directory and the file if
   * not existing and replaces the file content.
   *
   * @param {string[]} history - An array of history entries sorted from
   * newest to oldest.
   */
  async save(history) {
    await this.userData.write(this.fileName, history);
  }

  /**
   * Loads the history from disk. Returns an empty array if the file does
   * not exist or cannot be accessed.
   *
   * @returns {Promise<string[]>} An array of history entries sorted from
   * newest to oldest.
   */
  async load() {
    try {
      return (await this.userData.readOne(this.fileName)) ?? [];
    } catch (e) {
      return [];
    }
  }
}

import { Filesystem, getAppName } from '@mongodb-js/compass-utils';

export class HistoryStorage {
  fileName = 'shell-history.json';
  fs = new Filesystem({
    // Todo: https://jira.mongodb.org/browse/COMPASS-7080
    subdir: getAppName(),
  });

  /**
   * Saves the history to disk, it creates the directory and the file if
   * not existing and replaces the file content.
   *
   * @param {string[]} history - An array of history entries sorted from
   * newest to oldest.
   */
  async save(history) {
    await this.fs.write(this.fileName, history);
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
      return await this.fs.readOne(this.fileName);
    } catch (e) {
      return [];
    }
  }
}

import fs from 'fs';
import path from 'path';

/**
 * Persists and retrieves history to / from disk
 */
export class HistoryStorage {
  constructor(filePath) {
    this.filePath = filePath;
  }

  /**
   * Saves the history to disk, it creates the directory and the file if
   * not existing and replaces the file content.
   *
   * @param {string[]} history - An array of history entries sorted from
   * newest to oldest.
   */
  async save(history) {
    const targetDir = path.dirname(this.filePath);
    try {
      await fs.promises.mkdir(targetDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }

    await fs.promises.writeFile(this.filePath, JSON.stringify(history));
  }

  /**
   * Loads the history from disk. Returns an empty array if the file does
   * not exist or cannot be accessed.
   *
   * @returns {string[]} An array of history entries sorted from
   * newest to oldest.
   */
  async load() {
    if (!await this._canAccess(this.filePath)) {
      return [];
    }

    const content = await fs.promises.readFile(this.filePath, 'utf-8');
    return JSON.parse(content);
  }

  async _canAccess(filePath) {
    try {
      await fs.promises.access(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }
}

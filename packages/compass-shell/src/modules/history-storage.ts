import { FileUserData, z } from '@mongodb-js/compass-user-data';
import { getAppName } from '@mongodb-js/compass-utils';

export class HistoryStorage {
  fileName = 'shell-history';
  userData;
  private migrationChecked = false;

  constructor(basePath?: string) {
    // TODO: https://jira.mongodb.org/browse/COMPASS-7080
    this.userData = new FileUserData(z.string().array(), 'ShellHistory', {
      basePath,
    });
  }

  /**
   * Migrates history from old app-name-based folder to new ShellHistory folder.
   * Only runs once per instance and only if old folder exists.
   */
  private async migrateIfNeeded(): Promise<void> {
    if (this.migrationChecked) {
      return;
    }
    this.migrationChecked = true;

    const oldAppName = getAppName();
    if (oldAppName && oldAppName !== 'ShellHistory') {
      await this.userData.migrateFromOldFolder(oldAppName);
    }
  }

  /**
   * Saves the history to disk, it creates the directory and the file if
   * not existing and replaces the file content.
   *
   * @param {string[]} history - An array of history entries sorted from
   * newest to oldest.
   */
  async save(history: string[]) {
    await this.migrateIfNeeded();
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
    await this.migrateIfNeeded();
    try {
      return (await this.userData.readOne(this.fileName)) ?? [];
    } catch {
      return [];
    }
  }
}

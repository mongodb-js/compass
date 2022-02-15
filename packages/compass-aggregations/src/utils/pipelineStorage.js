import { promises as fs } from 'fs';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

import { getDirectory } from './getDirectory';

export class PipelineStorage {
  /**
   *
   * Loads all saved pipelines from the storage.
   *
   */
  async loadAll() {
    const dir = getDirectory();
    const files = (await fs.readdir(dir))
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join(dir, file));

    return (
      await Promise.all(files.map((filePath) => this._getFileData(filePath)))
    ).filter(Boolean);
  }

  async _getFileData(filePath) {
    try {
      const [file, stats] = await Promise.all([
        fs.readFile(filePath, 'utf8'),
        fs.stat(filePath),
      ]);
      return {
        ...JSON.parse(file),
        lastModified: stats.mtimeMs,
      };
    } catch (err) {
      debug(`Failed to load pipeline ${path.basename(filePath)}`, err);
      return null;
    }
  }

  /**
   * Deletes an aggregation from the storage.
   *
   * @param {string} id Aggregation ID
   */
  async delete(id) {
    track('Aggregation Deleted');
    const file = path.join(getDirectory(), `${id}.json`);
    return fs.unlink(file);
  }
}

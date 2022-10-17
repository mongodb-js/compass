import { promises as fs } from 'fs';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

import { getDirectory } from './get-directory';
import { stageToString } from '../modules/pipeline-builder/stage';

const ENCODING_UTF8 = 'utf8';

 function savedPipelineToText(pipeline) {
  const stages = pipeline.map(
    ({ stageOperator, isEnabled, stage }) => 
      stageToString(stageOperator, stage, !isEnabled)
  );

  return `[\n${stages.join(',\n')}\n]`;
}

export class PipelineStorage {
  async loadAll() {
    const dir = getDirectory();
    const files = (await fs.readdir(dir))
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join(dir, file));

    return (
      await Promise.all(files.map((filePath) => this._loadOne(filePath)))
    ).filter(Boolean);
  }

  async load(id) {
    return this._loadOne(path.join(getDirectory(), `${id}.json`));
  }

  async _loadOne(filePath) {
    try {
      const [data, stats] = await Promise.all([
        this._getFileData(filePath),
        fs.stat(filePath),
      ]);
      return {
        ...data,
        lastModified: stats.mtimeMs,
        pipelineText: data.pipelineText ?? savedPipelineToText(data.pipeline ?? []),
      };
    } catch (err) {
      debug(`Failed to load pipeline ${path.basename(filePath)}`, err);
      return null;
    }
  }

  async _getFileData(filePath) {
    const data = await fs.readFile(filePath, ENCODING_UTF8);
    return JSON.parse(data);
  }

  /**
   * Updates attributes of an pipeline.
   *
   * @param {string} id ID of the pipeline to update
   * @param {object} attributes Attributes of pipeline to update
   */
  async updateAttributes(id, attributes) {
    if (!id) {
      throw new Error('pipelineId is required');
    }
    const dir = getDirectory();
    // If we are creating a new item and none were created before this directory
    // might be missing
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${id}.json`);
    // lastModified is generated on file load, we don't want to store it
    // eslint-disable-next-line no-unused-vars
    const { lastModified, ...data } = (await this._loadOne(filePath)) ?? {};
    const updated = {
      ...data,
      ...attributes,
    };
    await fs.writeFile(
      filePath,
      JSON.stringify(updated, null, 2),
      ENCODING_UTF8
    );
    return updated;
  }

  async delete(id) {
    const file = path.join(getDirectory(), `${id}.json`);
    return fs.unlink(file);
  }
}

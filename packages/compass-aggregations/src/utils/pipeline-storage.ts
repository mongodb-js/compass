import { promises as fs } from 'fs';
import path from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { getDirectory } from './get-directory';
import { stageToString } from '../modules/pipeline-builder/stage';

const { debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const ENCODING_UTF8 = 'utf8';

export type StoredPipeline = {
  id: string;
  name: string;
  namespace: string;
  comments?: boolean;
  autoPreview?: boolean;
  collationString?: string;
  pipeline?: { stageOperator: string; isEnabled: boolean; stage: string }[];
  host?: string | null;
  pipelineText: string;
  lastModified: number;
};

function savedPipelineToText(pipeline: StoredPipeline['pipeline']): string {
  const stages = pipeline?.map(({ stageOperator, isEnabled, stage }) =>
    stageToString(stageOperator, stage, !isEnabled)
  ) ?? [];

  return `[\n${stages.join(',\n')}\n]`;
}

function hasAllRequiredKeys(pipeline?: any): pipeline is StoredPipeline {
  return (
    pipeline &&
    typeof pipeline === 'object' &&
    ['id', 'name', 'namespace'].every((key) => key in pipeline)
  );
}

export class PipelineStorage {
  async loadAll(): Promise<StoredPipeline[]> {
    const dir = getDirectory();
    const files = (await fs.readdir(dir))
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.join(dir, file));

    return (
      await Promise.all(files.map((filePath) => this._loadOne(filePath)))
    ).filter(Boolean) as StoredPipeline[];
  }

  async load(id: string): Promise<StoredPipeline | null> {
    return this._loadOne(path.join(getDirectory(), `${id}.json`));
  }

  async _loadOne(filePath: string): Promise<StoredPipeline | null> {
    try {
      const [data, stats] = await Promise.all([
        this._getFileData(filePath),
        fs.stat(filePath)
      ]);
      if (!hasAllRequiredKeys(data)) {
        return null;
      }
      return {
        ...data,
        lastModified: stats.mtimeMs,
        pipelineText:
          data.pipelineText ?? savedPipelineToText(data.pipeline)
      };
    } catch (err) {
      debug(`Failed to load pipeline ${path.basename(filePath)}`, err);
      return null;
    }
  }

  async _getFileData(filePath: string): Promise<unknown> {
    const data = await fs.readFile(filePath, ENCODING_UTF8);
    return JSON.parse(data);
  }

  /**
   * Updates attributes of an pipeline.
   */
  async updateAttributes(
    id: string,
    attributes: Partial<StoredPipeline>
  ) {
    if (!id) {
      throw new Error('pipelineId is required');
    }
    const dir = getDirectory();
    // If we are creating a new item and none were created before this directory
    // might be missing
    await fs.mkdir(dir, { recursive: true });
    const filePath = path.join(dir, `${id}.json`);
    // lastModified is generated on file load, we don't want to store it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lastModified, ...data } = (await this._loadOne(filePath)) ?? {};
    const updated = {
      ...data,
      ...attributes
    };
    await fs.writeFile(
      filePath,
      JSON.stringify(updated, null, 2),
      ENCODING_UTF8
    );
    return updated;
  }

  async delete(id: string) {
    const file = path.join(getDirectory(), `${id}.json`);
    return fs.unlink(file);
  }
}

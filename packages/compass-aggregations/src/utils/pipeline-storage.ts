import { promises as fs } from 'fs';
import { join, basename } from 'path';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { prettify } from '../modules/pipeline-builder/pipeline-parser/utils';

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

function stageToString(
  operator: string,
  value: string,
  disabled: boolean
): string {
  const str = `{
  ${operator}: ${value}
}`;

  if (!disabled) {
    return str;
  }

  return str
    .split('\n')
    .map((line) => `// ${line}`)
    .join('\n');
}

function savedPipelineToText(pipeline: StoredPipeline['pipeline']): string {
  const stages =
    pipeline?.map(({ stageOperator, isEnabled, stage }) =>
      stageToString(stageOperator, stage, !isEnabled)
    ) ?? [];

  const source = `[\n${stages.join(',\n')}\n]`;

  try {
    return prettify(source);
  } catch {
    // In case there are syntax errors in the source and we couldn't prettify it
    // before loading
    return source;
  }
}

function hasAllRequiredKeys(pipeline?: any): pipeline is StoredPipeline {
  return (
    pipeline &&
    typeof pipeline === 'object' &&
    ['id', 'name', 'namespace'].every((key) => key in pipeline)
  );
}

export class PipelineStorage {
  private readonly folder = 'SavedPipelines';
  constructor(private readonly basepath: string = '') {}

  private getFolderPath() {
    return join(this.basepath, this.folder);
  }

  private getFilePath(id: string) {
    return join(this.getFolderPath(), `${id}.json`);
  }

  async loadAll(): Promise<StoredPipeline[]> {
    try {
      const fileIds = (await fs.readdir(this.getFolderPath()))
        .filter((file) => file.endsWith('.json'))
        .map((file) => file.replace('.json', ''));

      return (
        await Promise.all(
          fileIds.map((id) => this._loadOne(this.getFilePath(id)))
        )
      ).filter(Boolean) as StoredPipeline[];
    } catch (e) {
      return [];
    }
  }

  async load(id: string): Promise<StoredPipeline | null> {
    return this._loadOne(this.getFilePath(id));
  }

  async _loadOne(filePath: string): Promise<StoredPipeline | null> {
    try {
      const [data, stats] = await Promise.all([
        this._getFileData(filePath),
        fs.stat(filePath),
      ]);
      if (!hasAllRequiredKeys(data)) {
        return null;
      }
      return {
        ...data,
        lastModified: stats.mtimeMs,
        pipelineText: data.pipelineText ?? savedPipelineToText(data.pipeline),
      };
    } catch (err) {
      debug(`Failed to load pipeline ${basename(filePath)}`, err);
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
  async updateAttributes(id: string, attributes: Partial<StoredPipeline>) {
    if (!id) {
      throw new Error('pipelineId is required');
    }
    // If we are creating a new item and none were created before this directory
    // might be missing
    await fs.mkdir(this.getFolderPath(), { recursive: true });
    const filePath = this.getFilePath(id);
    // lastModified is generated on file load, we don't want to store it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  async delete(id: string) {
    await fs.unlink(this.getFilePath(id));
  }
}

import { z } from 'zod';
import { UserData } from '@mongodb-js/compass-user-data';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { prettify } from '../modules/pipeline-builder/pipeline-parser/utils';

const { debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

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

function savedPipelineToText(pipeline?: any[]): string {
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

const PipelineSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    namespace: z.string(),
    comments: z.boolean().optional(),
    autoPreview: z.boolean().optional(),
    collationString: z.string().optional(),
    pipeline: z
      .array(
        z.object({
          stageOperator: z.string(),
          isEnabled: z.boolean(),
          stage: z.string(),
        })
      )
      .optional()
      .describe('Legacy property to stored pipeline. Use pipelineText.'),
    host: z.string().nullable().optional(),
    pipelineText: z.string().optional(),
    lastModified: z
      .number()
      .transform((x) => new Date(x))
      .optional(),
  })
  .transform((input) => {
    const {
      pipeline: legacyPipelineArray,
      pipelineText,
      ...restOfInput
    } = input;
    return {
      ...restOfInput,
      pipelineText: pipelineText ?? savedPipelineToText(legacyPipelineArray),
    };
  });

export type StoredPipeline = z.output<typeof PipelineSchema>;

type SaveablePipeline = Omit<z.input<typeof PipelineSchema>, 'pipeline'>;

export class PipelineStorage {
  private readonly userData: UserData<typeof PipelineSchema>;
  constructor(basePath?: string) {
    this.userData = new UserData(PipelineSchema, {
      subdir: 'SavedPipelines',
      basePath,
    });
  }
  async loadAll(): Promise<StoredPipeline[]> {
    try {
      const { data } = await this.userData.readAll({
        ignoreErrors: false,
        readFileStats: true,
        mergeStats(input, stats) {
          return {
            ...input,
            lastModified: Number(stats.mtimeMs),
          };
        },
      });
      return data;
    } catch (e) {
      debug('Failed to read saved pipelines.', e);
      return [];
    }
  }

  async updateAttributes(id: string, attributes: Partial<SaveablePipeline>) {
    await this.userData.write(id, {
      ...((await this.userData.readOne(id)) ?? {}),
      lastModified: Date.now(),
      ...attributes,
    });
    return await this.userData.readOne(id);
  }

  async delete(id: string) {
    await this.userData.delete(id);
  }
}

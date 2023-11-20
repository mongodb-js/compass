import type { Stats } from '@mongodb-js/compass-user-data';
import { UserData, z } from '@mongodb-js/compass-user-data';
import { prettify } from '@mongodb-js/compass-editor';

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

type StoredLegacyPipelineStage = {
  stageOperator: string;
  isEnabled: boolean;
  stage: string;
};

function savedPipelineToText(
  pipeline?: StoredLegacyPipelineStage[] | undefined
): string {
  const stages =
    pipeline?.map(({ stageOperator, isEnabled, stage }) => {
      return stageToString(stageOperator, stage, !isEnabled);
    }) ?? [];

  const source = `[\n${stages.join(',\n')}\n]`;

  try {
    return prettify(source);
  } catch {
    // In case there are syntax errors in the source and we couldn't prettify it
    // before loading
    return source;
  }
}

const PipelineSchema = z.preprocess(
  (val: any) => {
    const { pipeline: legacyPipelineArray, pipelineText, ...rest } = val;
    return {
      ...rest,
      pipelineText: pipelineText ?? savedPipelineToText(legacyPipelineArray),
    };
  },
  z.object({
    id: z.string(),
    name: z.string(),
    namespace: z.string(),
    comments: z.boolean().optional(),
    autoPreview: z.boolean().optional(),
    collationString: z.string().optional(),
    host: z.string().nullable().optional(),
    pipelineText: z.string(),
    lastModified: z
      .number()
      .transform((x) => new Date(x))
      .optional(),
  })
);

export type SavedPipeline = z.output<typeof PipelineSchema>;

export class PipelineStorage {
  private readonly userData: UserData<typeof PipelineSchema>;
  constructor(basePath?: string) {
    this.userData = new UserData(PipelineSchema, {
      subdir: 'SavedPipelines',
      basePath,
    });
  }

  private mergeStats(pipeline: SavedPipeline, stats: Stats): SavedPipeline {
    return {
      ...pipeline,
      lastModified: new Date(stats.ctimeMs),
    };
  }

  async loadAll(): Promise<SavedPipeline[]> {
    try {
      const { data } = await this.userData.readAllWithStats({
        ignoreErrors: false,
      });
      return data.map(([item, stats]) => {
        return this.mergeStats(item, stats);
      });
    } catch {
      return [];
    }
  }

  /** loads all pipelines that satisfy `predicate` */
  loadMany(
    predicate: (arg0: SavedPipeline) => boolean
  ): Promise<SavedPipeline[]> {
    return this.loadAll().then((pipelines) => pipelines.filter(predicate));
  }

  private async loadOne(id: string): Promise<SavedPipeline> {
    const [item, stats] = await this.userData.readOneWithStats(id);
    return this.mergeStats(item, stats);
  }

  async createOrUpdate(id: string, attributes: SavedPipeline) {
    const pipelineExists = Boolean(
      await this.userData.readOne(id, {
        ignoreErrors: true,
      })
    );
    return await (pipelineExists
      ? this.updateAttributes(id, attributes)
      : this.create(attributes));
  }

  private async create(data: SavedPipeline) {
    await this.userData.write(data.id, {
      ...data,
      lastModified: Date.now(),
    });
    return await this.loadOne(data.id);
  }

  async updateAttributes(
    id: string,
    attributes: Partial<SavedPipeline>
  ): Promise<SavedPipeline> {
    await this.userData.write(id, {
      ...(await this.loadOne(id)),
      ...attributes,
      lastModified: Date.now(),
    });
    return await this.loadOne(id);
  }

  async delete(id: string) {
    await this.userData.delete(id);
  }
}

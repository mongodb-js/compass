import { z } from '@mongodb-js/compass-user-data';
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

function savedPipelineToText(pipeline?: StoredLegacyPipelineStage[]): string {
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

export const PipelineSchema = z.preprocess(
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
      .default(0)
      .transform((x) => new Date(x)),
  })
);

export type SavedPipeline = z.output<typeof PipelineSchema>;

import { z } from '@mongodb-js/compass-user-data';
import { prettify } from '@mongodb-js/compass-editor';
import { isValidMcpPromptName } from './mcp-prompt-name';

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
  (val: unknown) => {
    const {
      pipeline: legacyPipelineArray,
      pipelineText,
      ...rest
    } = val as Record<string, unknown>;
    return {
      ...rest,
      pipelineText:
        pipelineText ??
        savedPipelineToText(
          legacyPipelineArray as StoredLegacyPipelineStage[] | undefined
        ),
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
    /**
     * Human-readable description of what the aggregation does, used by
     * AI agents (via the MCP server) to decide whether this pipeline fits
     * a user's request. Optional — pipelines saved before this field
     * existed (or without a description) are hidden from the AI catalog.
     */
    description: z.string().optional(),
    /**
     * Marks who authored the pipeline. `ai` indicates the pipeline was
     * saved by an external AI agent through the MCP `save-saved-query`
     * tool; surfaced in the saved-aggregations UI for audit. Absent on
     * pipelines saved before this field existed.
     */
    authoredBy: z.enum(['ai', 'human']).optional(),
    /**
     * Optional slash-command name under which the MCP server publishes
     * this saved pipeline as an MCP prompt. See the equivalent field on
     * the FavoriteQuery schema for full context.
     */
    mcpPromptName: z
      .string()
      .refine(isValidMcpPromptName, {
        message:
          'Invalid MCP prompt name: must be lowercase kebab-case, 1–64 chars, starting with a letter.',
      })
      .optional(),
  })
);

export type SavedPipeline = z.output<typeof PipelineSchema>;

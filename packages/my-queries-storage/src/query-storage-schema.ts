import { z } from '@mongodb-js/compass-user-data';
import { isValidMcpPromptName } from './mcp-prompt-name';

const queryProps = {
  filter: z.any().optional(),
  project: z.any().optional(),
  collation: z.any().optional(),
  sort: z.any().optional(),
  skip: z.number().optional(),
  limit: z.number().optional(),
  update: z.any().optional(),
  hint: z.any().optional(),
};

const commonMetadata = {
  _id: z.string().uuid(),
  _lastExecuted: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  _ns: z.string(),
  _host: z.string().optional(),
};

export const RecentQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
});

export const FavoriteQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
  _name: z.string().nonempty(),
  _dateModified: z
    .union([z.coerce.date(), z.number()])
    .optional()
    .transform((x) => (x !== undefined ? new Date(x) : x)),
  _dateSaved: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  /**
   * Human-readable description of what the query does, used by AI agents
   * (via the MCP server) to decide whether this saved query fits a
   * user's request. Optional — pre-existing saved queries (and ones the
   * user creates via the Compass UI before adding a description) have no
   * description and are hidden from the AI catalog.
   */
  _description: z.string().optional(),
  /**
   * Marks who authored the query. `ai` indicates the query was saved by
   * an external AI agent through the MCP `save-saved-query` tool; surfaced
   * in the saved-queries UI so users can audit / clean up AI-authored
   * entries. Absent on queries saved before this field existed.
   */
  _authoredBy: z.enum(['ai', 'human']).optional(),
  /**
   * Optional slash-command name under which the MCP server publishes this
   * saved query as an MCP prompt. When set, AI clients (Claude Desktop,
   * Cursor, …) surface the saved query in their slash menu — e.g.
   * `/search-trips` — so users can invoke the saved query without
   * describing it to the AI. Validated against the kebab-case rules in
   * `mcp-prompt-name.ts`. Uniqueness across saved items is enforced by
   * the MCP server at prompt-registration time, not the schema.
   */
  _mcpPromptName: z
    .string()
    .refine(isValidMcpPromptName, {
      message:
        'Invalid MCP prompt name: must be lowercase kebab-case, 1–64 chars, starting with a letter.',
    })
    .optional(),
});

export type RecentQuery = z.output<typeof RecentQuerySchema>;

export type FavoriteQuery = z.output<typeof FavoriteQuerySchema>;

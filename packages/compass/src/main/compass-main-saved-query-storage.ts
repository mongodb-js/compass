import { UUID } from 'bson';
import {
  createElectronFavoriteQueryStorage,
  createElectronPipelineStorage,
  isValidMcpPromptName,
} from '@mongodb-js/my-queries-storage';
import type { FavoriteQueryStorageInterface } from '@mongodb-js/my-queries-storage';
import type {
  McpSavedQueryStorage,
  SaveAggregationInput,
  SaveQueryInput,
  SavedQueryItem,
} from '@mongodb-js/compass-mcp-server';

/**
 * Main-process adapter that exposes Compass's saved-query + saved-pipeline
 * storages through the `McpSavedQueryStorage` interface so the MCP server
 * (also running in main) can read and append to the catalog.
 *
 * Compass's renderer instantiates its own copies of these same storages
 * pointing at the same `FileUserData` basepath. Both processes can read
 * and write the files; writes are atomic per-file at the storage layer, so
 * the rare overlap (user clicks Save in the UI at the exact moment an AI
 * agent fires save-saved-query) is last-writer-wins on individual files,
 * not a corruption risk.
 *
 * The `loadDescribed` method filters out items without a description —
 * those are pre-existing saves the human author didn't annotate, and
 * including them in the AI catalog would pollute the tool's signal.
 *
 * The save methods enforce **MCP-prompt-name uniqueness** across both
 * stores: if an AI agent tries to save a new item with an `mcpPromptName`
 * that's already in use, the save still succeeds but the offending field
 * is dropped (the AI can't accidentally hijack an existing slash command).
 * The same uniqueness rule is the reason `loadDescribed` deduplicates
 * conflicting prompt names on read (last-modified wins).
 */
class CompassMainSavedQueryStorage implements McpSavedQueryStorage {
  private readonly favoriteQueries: FavoriteQueryStorageInterface;
  private readonly pipelines = createElectronPipelineStorage();

  constructor() {
    this.favoriteQueries = createElectronFavoriteQueryStorage();
  }

  async loadDescribed(): Promise<SavedQueryItem[]> {
    const [queries, pipelines] = await Promise.all([
      this.favoriteQueries.loadAll(),
      this.pipelines.loadAll(),
    ]);

    const items: SavedQueryItem[] = [];

    for (const q of queries) {
      if (!q._description) continue;
      items.push({
        type: 'query',
        id: q._id,
        namespace: q._ns,
        name: q._name,
        description: q._description,
        authoredBy: q._authoredBy ?? 'human',
        mcpPromptName: q._mcpPromptName,
        lastModified: q._dateModified ?? q._dateSaved,
        filter: q.filter,
        project: q.project,
        sort: q.sort,
        collation: q.collation,
        skip: q.skip,
        limit: q.limit,
      });
    }

    for (const p of pipelines) {
      if (!p.description) continue;
      items.push({
        type: 'aggregation',
        id: p.id,
        namespace: p.namespace,
        name: p.name,
        description: p.description,
        authoredBy: p.authoredBy ?? 'human',
        mcpPromptName: p.mcpPromptName,
        lastModified: p.lastModified,
        pipelineText: p.pipelineText,
      });
    }

    return dedupePromptNames(items);
  }

  async saveQuery(input: SaveQueryInput): Promise<{ id: string }> {
    // FavoriteQueryStorage generates `_id` / `_lastExecuted` / `_dateSaved`
    // itself but takes the rest verbatim. We tag `_authoredBy: 'ai'` so
    // users can audit AI-saved entries from the Compass UI.
    const id = new UUID().toString();
    const safePromptName = await this.resolveUniquePromptName(
      input.mcpPromptName
    );
    await this.favoriteQueries.saveQuery(
      {
        _name: input.name,
        _description: input.description,
        _authoredBy: 'ai',
        _mcpPromptName: safePromptName,
        _ns: input.namespace,
        filter: input.filter,
        project: input.project,
        sort: input.sort,
        collation: input.collation,
        skip: input.skip,
        limit: input.limit,
      },
      id
    );
    return { id };
  }

  async saveAggregation(input: SaveAggregationInput): Promise<{ id: string }> {
    const id = new UUID().toString();
    const safePromptName = await this.resolveUniquePromptName(
      input.mcpPromptName
    );
    await this.pipelines.createOrUpdate(id, {
      id,
      name: input.name,
      namespace: input.namespace,
      pipelineText: input.pipelineText,
      description: input.description,
      authoredBy: 'ai',
      mcpPromptName: safePromptName,
    });
    return { id };
  }

  /**
   * Returns the requested prompt name only if it's both well-formed and
   * not already in use across either store; returns `undefined` otherwise.
   * Treating "already in use" as a silent drop (rather than rejecting the
   * save) is deliberate: the AI is offering a hint, not asserting a hard
   * requirement. The user can rename via the edit modal later.
   */
  private async resolveUniquePromptName(
    candidate: string | undefined
  ): Promise<string | undefined> {
    if (!candidate || !isValidMcpPromptName(candidate)) return undefined;
    const [queries, pipelines] = await Promise.all([
      this.favoriteQueries.loadAll(),
      this.pipelines.loadAll(),
    ]);
    const used = new Set<string>();
    for (const q of queries) {
      if (q._mcpPromptName) used.add(q._mcpPromptName);
    }
    for (const p of pipelines) {
      if (p.mcpPromptName) used.add(p.mcpPromptName);
    }
    return used.has(candidate) ? undefined : candidate;
  }
}

/**
 * If two saved items somehow share the same `mcpPromptName` (manual file
 * edits, race between two AI sessions), keep the most-recently-modified
 * one and clear `mcpPromptName` on the rest. Items without a prompt name
 * pass through untouched.
 */
function dedupePromptNames(items: SavedQueryItem[]): SavedQueryItem[] {
  const byName = new Map<string, SavedQueryItem>();
  for (const item of items) {
    if (!item.mcpPromptName) continue;
    const existing = byName.get(item.mcpPromptName);
    if (!existing) {
      byName.set(item.mcpPromptName, item);
      continue;
    }
    const a = item.lastModified?.getTime() ?? 0;
    const b = existing.lastModified?.getTime() ?? 0;
    if (a > b) byName.set(item.mcpPromptName, item);
  }
  return items.map((item) => {
    if (!item.mcpPromptName) return item;
    const winner = byName.get(item.mcpPromptName);
    if (winner && winner.id === item.id) return item;
    // Strip the prompt name from non-winners so the catalog never reports
    // a collision to the MCP prompts layer.
    return { ...item, mcpPromptName: undefined };
  });
}

let instance: CompassMainSavedQueryStorage | null = null;

/** Lazily-initialized singleton — matches the connection-storage pattern. */
export function getCompassMainSavedQueryStorage(): McpSavedQueryStorage {
  if (!instance) {
    instance = new CompassMainSavedQueryStorage();
  }
  return instance;
}

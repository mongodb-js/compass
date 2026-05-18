import type { AnyToolClass } from 'mongodb-mcp-server';
import type { CompassConnectionManager } from './compass-connection-manager';
import {
  type CompassToolContext,
  McpAccessDeniedError,
} from './compass-tool-context';
import { isToolAllowed } from './presets';

/**
 * Aggregate-stage operators that write data and must therefore be gated to
 * the `full-access` preset only. Upstream's `userConfig.readOnly: true`
 * normally filters these inside the aggregate tool — we now run with
 * `readOnly: false` so the full-access preset works end-to-end, and enforce
 * the same restriction ourselves per-call.
 */
const WRITE_STAGES = new Set(['$out', '$merge']);

/**
 * Shape of the per-session inputs that aren't tied to a specific
 * `CompassConnectionManager` instance. `CompassSocketServer` builds its
 * tool context from these plus the connection manager it just instantiated
 * for the accepted socket connection.
 */
interface SharedToolContextOpts {
  getAllConnections: CompassToolContext['getAllConnections'];
  openCollection: CompassToolContext['openCollection'];
  listSavedQueries: CompassToolContext['listSavedQueries'];
  saveSavedQuery: CompassToolContext['saveSavedQuery'];
  saveSavedAggregation: CompassToolContext['saveSavedAggregation'];
}

/**
 * Constructs the `CompassToolContext` for a single MCP session, binding
 * `checkAccess` to the lifetime of the given connection manager so the gate
 * always reads the currently-active preset.
 */
export function buildToolContext(
  connectionManager: CompassConnectionManager,
  shared: SharedToolContextOpts
): CompassToolContext {
  return {
    getAllConnections: shared.getAllConnections,
    openCollection: shared.openCollection,
    listSavedQueries: shared.listSavedQueries,
    saveSavedQuery: shared.saveSavedQuery,
    saveSavedAggregation: shared.saveSavedAggregation,
    checkAccess: (toolName) => {
      const preset = connectionManager.getActivePreset();
      // Tools that legitimately run before a connection exists (e.g. the
      // `connect` and `list-connections` tools themselves) hit this path
      // before any preset has been set. Skip the gate in that case — the
      // connect tool itself enforces user consent.
      if (!preset) return;
      if (!isToolAllowed(preset, toolName)) {
        throw new McpAccessDeniedError(toolName, preset);
      }
    },
  };
}

/**
 * Wrap an upstream tool class so its `execute` first runs the access check
 * against the current connection's preset. Used for the `mongodb-mcp-server`
 * read tools (`find`, `aggregate`, `count`, ...) whose source we can't edit
 * but which share our `CompassToolContext` at runtime.
 *
 * No-op for tools called before any connection has been established
 * (preset === undefined) — the gate engages once `connect` has run.
 */
export function withAccessCheck<T extends AnyToolClass>(
  ToolClass: T,
  options: {
    /**
     * Optional argument-level validator. Receives the parsed tool args and
     * runs AFTER the preset-allowlist check has passed. Throw
     * `McpAccessDeniedError` (or any Error) to reject. Used by the
     * aggregate wrapper to block `$out` / `$merge` pipeline stages when
     * the preset isn't `full-access`.
     */
    validateArgs?: (
      args: unknown,
      ctx: { preset: string; toolName: string }
    ) => void;
  } = {}
): T {
  const { validateArgs } = options;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped = class extends (ToolClass as any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected execute(...args: any[]): Promise<any> {
      const ctx = (
        this as unknown as { context?: CompassToolContext; name: string }
      ).context;
      const name = (this as unknown as { name: string }).name;
      ctx?.checkAccess(name);
      if (validateArgs) {
        const preset = ctx
          ? (
              this as unknown as {
                session: { connectionManager: CompassConnectionManager };
              }
            ).session?.connectionManager?.getActivePreset?.()
          : undefined;
        if (preset) {
          validateArgs(args[0], { preset, toolName: name });
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return super.execute(...args);
    }
  };
  // Preserve the static toolName/category/operationType the registry reads.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (wrapped as any).toolName = (ToolClass as any).toolName;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (wrapped as any).category = (ToolClass as any).category;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  (wrapped as any).operationType = (ToolClass as any).operationType;
  return wrapped as unknown as T;
}

/**
 * `validateArgs` for the upstream `AggregateTool`. Rejects pipelines that
 * contain `$out` or `$merge` stages unless the active preset is
 * `full-access`. Inspects only the top-level stage operator keys — does not
 * recursively descend, which matches the upstream `readOnly` behavior.
 */
export function aggregateStageGate(
  args: unknown,
  { preset, toolName }: { preset: string; toolName: string }
): void {
  if (preset === 'full-access') return;
  const pipeline =
    args && typeof args === 'object' && 'pipeline' in args
      ? (args as { pipeline?: unknown[] }).pipeline
      : undefined;
  if (!Array.isArray(pipeline)) return;
  for (const stage of pipeline) {
    if (!stage || typeof stage !== 'object') continue;
    for (const key of Object.keys(stage)) {
      if (WRITE_STAGES.has(key)) {
        throw new McpAccessDeniedError(`${toolName}+${key}`, preset);
      }
    }
  }
}

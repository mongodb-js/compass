import type { AnyToolClass } from 'mongodb-mcp-server';
import type { CompassConnectionManager } from './compass-connection-manager';
import {
  type CompassToolContext,
  McpAccessDeniedError,
} from './compass-tool-context';
import { isToolAllowed } from './presets';

/**
 * Shape of the per-session, per-runner inputs that aren't tied to a specific
 * `CompassConnectionManager` instance. Both `CompassHttpRunner` and
 * `CompassSocketServer` build their tool context from these plus the
 * connection manager they just instantiated for this session.
 */
export interface SharedToolContextOpts {
  getAllConnections: CompassToolContext['getAllConnections'];
  openCollection: CompassToolContext['openCollection'];
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
export function withAccessCheck<T extends AnyToolClass>(ToolClass: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapped = class extends (ToolClass as any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected execute(...args: any[]): Promise<any> {
      const ctx = (
        this as unknown as { context?: CompassToolContext; name: string }
      ).context;
      const name = (this as unknown as { name: string }).name;
      ctx?.checkAccess(name);
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

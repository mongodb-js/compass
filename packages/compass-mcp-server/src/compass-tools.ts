import {
  AggregateTool,
  CollectionIndexesTool,
  CollectionSchemaTool,
  CollectionStorageSizeTool,
  CountTool,
  CreateCollectionTool,
  CreateIndexTool,
  DbStatsTool,
  DeleteManyTool,
  DropCollectionTool,
  DropDatabaseTool,
  DropIndexTool,
  ExplainTool,
  FindTool,
  InsertManyTool,
  ListCollectionsTool,
  ListDatabasesTool,
  RenameCollectionTool,
  UpdateManyTool,
} from 'mongodb-mcp-server/tools';
import { ListConnectionsTool } from './list-connections-tool';
import { CompassConnectTool } from './compass-connect-tool';
import { CompassOpenCollectionTool } from './compass-open-collection-tool';
import { ListSavedQueriesTool } from './list-saved-queries-tool';
import { SaveSavedQueryTool } from './save-saved-query-tool';
import { aggregateStageGate, withAccessCheck } from './build-tool-context';

/**
 * The set of MCP tools registered for every Compass MCP session. Whether a
 * given tool actually fires for a given call depends on the active
 * connection's access preset (see `presets.ts` + `withAccessCheck`).
 *
 * The list always includes the write tools (insert/update/delete + DDL) so
 * that the `full-access` preset can legitimately run them; the per-call gate
 * rejects them for `metadata-only` and `read-only` presets. Aggregate is
 * additionally wrapped with a pipeline-stage gate that blocks `$out` /
 * `$merge` unless the active preset is `full-access`.
 */
export const COMPASS_TOOLS = [
  // Our own tools — call this.context.checkAccess() internally.
  CompassConnectTool,
  ListConnectionsTool,
  CompassOpenCollectionTool,
  ListSavedQueriesTool,
  SaveSavedQueryTool,

  // Upstream read / metadata tools.
  withAccessCheck(ListDatabasesTool),
  withAccessCheck(ListCollectionsTool),
  withAccessCheck(CollectionSchemaTool),
  withAccessCheck(CollectionIndexesTool),
  withAccessCheck(CollectionStorageSizeTool),
  withAccessCheck(FindTool),
  withAccessCheck(CountTool),
  withAccessCheck(AggregateTool, { validateArgs: aggregateStageGate }),
  withAccessCheck(DbStatsTool),
  withAccessCheck(ExplainTool),

  // Upstream write / DDL tools — only the `full-access` preset's allowlist
  // includes their tool names, so the gate denies them under the other two
  // presets at execute time.
  withAccessCheck(InsertManyTool),
  withAccessCheck(UpdateManyTool),
  withAccessCheck(DeleteManyTool),
  withAccessCheck(CreateIndexTool),
  withAccessCheck(DropIndexTool),
  withAccessCheck(CreateCollectionTool),
  withAccessCheck(DropCollectionTool),
  withAccessCheck(RenameCollectionTool),
  withAccessCheck(DropDatabaseTool),
];

import {
  AggregateTool,
  CollectionIndexesTool,
  CollectionSchemaTool,
  CollectionStorageSizeTool,
  CountTool,
  DbStatsTool,
  ExplainTool,
  FindTool,
  ListCollectionsTool,
  ListDatabasesTool,
} from 'mongodb-mcp-server/tools';
import { ListConnectionsTool } from './list-connections-tool';
import { CompassConnectTool } from './compass-connect-tool';
import { CompassOpenCollectionTool } from './compass-open-collection-tool';
import { withAccessCheck } from './build-tool-context';

/**
 * Tools exposed to external AI clients. Strictly read-only MongoDB data-plane
 * operations — no writes, no DDL, no Atlas control plane, no Atlas Local
 * deployment management, no assistant/knowledge tools, no log access.
 *
 * `CompassConnectTool` replaces the upstream `connect` tool so the AI picks a
 * saved Compass connection by id instead of supplying a raw connection string.
 */
export const COMPASS_TOOLS = [
  // Our own tools — call this.context.checkAccess() internally.
  CompassConnectTool,
  ListConnectionsTool,
  CompassOpenCollectionTool,
  // Upstream tools — wrapped to gate execute on the active connection's
  // preset (see withAccessCheck).
  withAccessCheck(ListDatabasesTool),
  withAccessCheck(ListCollectionsTool),
  withAccessCheck(CollectionSchemaTool),
  withAccessCheck(CollectionIndexesTool),
  withAccessCheck(CollectionStorageSizeTool),
  withAccessCheck(FindTool),
  withAccessCheck(CountTool),
  withAccessCheck(AggregateTool),
  withAccessCheck(DbStatsTool),
  withAccessCheck(ExplainTool),
];

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

/**
 * Tools exposed to external AI clients. Strictly read-only MongoDB data-plane
 * operations — no writes, no DDL, no Atlas control plane, no Atlas Local
 * deployment management, no assistant/knowledge tools, no log access.
 *
 * `CompassConnectTool` replaces the upstream `connect` tool so the AI picks a
 * saved Compass connection by id instead of supplying a raw connection string.
 */
export const COMPASS_TOOLS = [
  CompassConnectTool,
  ListConnectionsTool,
  ListDatabasesTool,
  ListCollectionsTool,
  CollectionSchemaTool,
  CollectionIndexesTool,
  CollectionStorageSizeTool,
  FindTool,
  CountTool,
  AggregateTool,
  DbStatsTool,
  ExplainTool,
  CompassOpenCollectionTool,
];

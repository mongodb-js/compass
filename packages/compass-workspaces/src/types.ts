import type { CompassPluginComponent } from '@mongodb-js/compass-app-registry';
import type { WorkspaceTabCoreProps } from '@mongodb-js/compass-components';
import { z } from '@mongodb-js/compass-user-data';

const CollectionSubtabSchema = z.enum([
  'Documents',
  'Aggregations',
  'Schema',
  'Indexes',
  'Validation',
  'GlobalWrites',
]);

export type CollectionSubtab = z.output<typeof CollectionSubtabSchema>;

const WelcomeWorkspaceSchema = z.object({
  type: z.literal('Welcome'),
});

export type WelcomeWorkspace = z.output<typeof WelcomeWorkspaceSchema>;

const MyQueriesWorkspaceSchema = z.object({
  type: z.literal('My Queries'),
});

export type MyQueriesWorkspace = z.output<typeof MyQueriesWorkspaceSchema>;

const DataModelingWorkspaceSchema = z.object({
  type: z.literal('Data Modeling'),
});

export type DataModelingWorkspace = z.output<
  typeof DataModelingWorkspaceSchema
>;

const DatabasesWorkspaceSchema = z.object({
  type: z.literal('Databases'),
  connectionId: z.string(),
});

export type DatabasesWorkspace = z.output<typeof DatabasesWorkspaceSchema>;

const ServerStatsWorkspaceSchema = z.object({
  type: z.literal('Performance'),
  connectionId: z.string(),
});

export type ServerStatsWorkspace = z.output<typeof ServerStatsWorkspaceSchema>;

const ShellWorkspaceSchema = z.object({
  type: z.literal('Shell'),
  connectionId: z.string(),
  initialEvaluate: z.union([z.string(), z.array(z.string())]).optional(),
  initialInput: z.string().optional(),
});

export type ShellWorkspace = z.output<typeof ShellWorkspaceSchema>;

const CollectionsWorkspaceSchema = z.object({
  type: z.literal('Collections'),
  connectionId: z.string(),
  namespace: z.string(),
  // TODO(COMPASS-9456): Remove the `inferredFromPrivileges` field here.
  inferredFromPrivileges: z.boolean().optional(),
});

export type CollectionsWorkspace = z.output<typeof CollectionsWorkspaceSchema>;

const CollectionWorkspaceSchema = z.object({
  type: z.literal('Collection'),
  subTab: CollectionSubtabSchema,
  initialQuery: z.record(z.any()).optional(),
  initialPipeline: z.array(z.record(z.any())).optional(),
  initialPipelineText: z.string().optional(),
  initialAggregation: z.record(z.any()).optional(),
  editViewName: z.string().optional(),
  connectionId: z.string(),
  namespace: z.string(),
  // TODO(COMPASS-9456): Remove the `inferredFromPrivileges` field here.
  inferredFromPrivileges: z.boolean().optional(),
});

export type CollectionWorkspace = z.output<typeof CollectionWorkspaceSchema> & {
  // TODO(COMPASS-7782): use hook to get the tab id within workspace.
  // This is not added in other workspaces
  // 1. because they don't need it and
  // 2. to avoid unnecessary changes in the types definition within those plugins.
  tabId: string;
};

const WorkspaceTabPropsSchema = z.discriminatedUnion('type', [
  WelcomeWorkspaceSchema,
  MyQueriesWorkspaceSchema,
  DataModelingWorkspaceSchema,
  DatabasesWorkspaceSchema,
  ServerStatsWorkspaceSchema,
  ShellWorkspaceSchema,
  CollectionsWorkspaceSchema,
  CollectionWorkspaceSchema,
]);

export type WorkspaceTabProps = z.output<typeof WorkspaceTabPropsSchema>;

export const WorkspaceTabSchema = WorkspaceTabPropsSchema.and(
  z.object({
    id: z.string(),
  })
);

export type WorkspaceTab = z.output<typeof WorkspaceTabSchema>;

export const WorkspacesStateSchema = z.object({
  tabs: z.array(WorkspaceTabSchema),
  activeTabId: z.string().nullable(),
  timestamp: z.number(),
});

export type WorkspacesStateData = z.output<typeof WorkspacesStateSchema>;

export type AnyWorkspace =
  | WelcomeWorkspace
  | MyQueriesWorkspace
  | DataModelingWorkspace
  | ShellWorkspace
  | ServerStatsWorkspace
  | DatabasesWorkspace
  | CollectionsWorkspace
  | CollectionWorkspace;

export type Workspace<T extends AnyWorkspace['type']> = Extract<
  AnyWorkspace,
  { type: T }
>;

export type WorkspacePluginProps<T extends AnyWorkspace['type']> = Omit<
  Workspace<T>,
  'type' | 'connectionId'
>;

export type PluginHeaderProps<T extends AnyWorkspace['type']> =
  WorkspaceTabCoreProps & WorkspacePluginProps<T>;

export type WorkspacePlugin<T extends AnyWorkspace['type']> = {
  name: T;
  provider: CompassPluginComponent<any, any, any>;
  content: (props: WorkspacePluginProps<T>) => React.ReactElement | null;
  header: (props: PluginHeaderProps<T>) => React.ReactElement | null;
};

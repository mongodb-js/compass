export type CollectionSubtab =
  | 'Documents'
  | 'Aggregations'
  | 'Schema'
  | 'Indexes'
  | 'Validation';

export type WelcomeWorkspace = {
  type: 'Welcome';
};

export type MyQueriesWorkspace = {
  type: 'My Queries';
};

export type ShellWorkspace = {
  type: 'Shell';
  connectionId: string;
  initialEvaluate?: string | string[];
  initialInput?: string;
};

export type ServerStatsWorkspace = {
  type: 'Performance';
  connectionId: string;
};

export type DatabasesWorkspace = {
  type: 'Databases';
  connectionId: string;
};

export type CollectionsWorkspace = {
  type: 'Collections';
  connectionId: string;
  namespace: string;
};

export type CollectionWorkspace = {
  // TODO(COMPASS-7782): use hook to get the tab id within workspace.
  // This is not added in other workspaces
  // 1. because they don't need it and
  // 2. to avoid unnecessary changes in the types definition within those plugins.
  tabId: string;
  type: 'Collection';
  connectionId: string;
  namespace: string;
  subTab: CollectionSubtab;
  initialQuery?: unknown;
  initialPipeline?: unknown[];
  initialPipelineText?: string;
  initialAggregation?: unknown;
  editViewName?: string;
};

export type AnyWorkspace =
  | WelcomeWorkspace
  | MyQueriesWorkspace
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

export type WorkspaceComponent<T extends AnyWorkspace['type']> = {
  name: T;
  component:
    | React.ComponentClass<WorkspacePluginProps<T>>
    | ((props: WorkspacePluginProps<T>) => React.ReactElement | null);
};

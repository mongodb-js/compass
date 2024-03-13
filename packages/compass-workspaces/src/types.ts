export type CollectionSubtab =
  | 'Documents'
  | 'Aggregations'
  | 'Schema'
  | 'Indexes'
  | 'Validation';

export type MyQueriesWorkspace = {
  type: 'My Queries';
};

export type ServerStatsWorkspace = {
  type: 'Performance';
};

export type DatabasesWorkspace = {
  type: 'Databases';
};

export type CollectionsWorkspace = {
  type: 'Collections';
  namespace: string;
};

export type CollectionWorkspace = {
  type: 'Collection';
  namespace: string;
  subTab: CollectionSubtab;
  onSelectSubtab(subtab: CollectionSubtab): void;
  initialQuery?: unknown;
  initialPipeline?: unknown[];
  initialPipelineText?: string;
  initialAggregation?: unknown;
  editViewName?: string;
};

export type AnyWorkspace =
  | MyQueriesWorkspace
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
  'type'
>;

export type WorkspaceComponent<T extends AnyWorkspace['type']> = {
  name: T;
  component:
    | React.ComponentClass<WorkspacePluginProps<T>>
    | ((props: WorkspacePluginProps<T>) => React.ReactElement | null);
};

import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  IUserData,
  type ReadAllResult,
  z,
} from '@mongodb-js/compass-user-data';
import React, { useContext, useRef } from 'react';

/**
 * Schema for saving workspace tab state to user data
 */

// Define schema for collection subtab
const CollectionSubtabSchema = z.enum([
  'Documents',
  'Aggregations',
  'Schema',
  'Indexes',
  'Validation',
  'GlobalWrites',
]);

// Define schema for workspace tab type
const WorkspaceTabTypeSchema = z.enum([
  'Welcome',
  'My Queries',
  'Data Modeling',
  'Shell',
  'Databases',
  'Performance',
  'Collections',
  'Collection',
]);

// Define schema for a workspace tab
export const WorkspaceTabSchema = z.object({
  id: z.string(),
  type: WorkspaceTabTypeSchema,
  connectionId: z.string().optional(),
  namespace: z.string().optional(),
  initialQuery: z.record(z.any()).optional(),
  initialAggregation: z.record(z.any()).optional(),
  initialPipeline: z.array(z.record(z.any())).optional(),
  initialPipelineText: z.string().optional(),
  editViewName: z.string().optional(),
  initialEvaluate: z.union([z.string(), z.array(z.string())]).optional(),
  initialInput: z.string().optional(),
  subTab: CollectionSubtabSchema.optional(),
});

// Define schema for the complete workspaces state
export const WorkspacesStateSchema = z.object({
  tabs: z.array(WorkspaceTabSchema),
  activeTabId: z.string().nullable(),
  timestamp: z.number(),
});

// TypeScript types derived from the schemas
export type WorkspaceTabData = z.output<typeof WorkspaceTabSchema>;
export type WorkspacesStateData = z.output<typeof WorkspacesStateSchema>;

const throwIfNotTestEnv = () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error("Can't find Workspaces storage service in React context");
  }
};

export class noopUserData<T extends z.Schema> extends IUserData<T> {
  write(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
  delete(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
  readAll(): Promise<ReadAllResult<T>> {
    throwIfNotTestEnv();
    return Promise.resolve({ data: [], errors: [] });
  }
  readOne(): Promise<z.output<T>> {
    throwIfNotTestEnv();
    return Promise.resolve(undefined);
  }
  updateAttributes(): Promise<boolean> {
    throwIfNotTestEnv();
    return Promise.resolve(true);
  }
}

export const noopWorkspacesStorageService: IUserData<
  typeof WorkspacesStateSchema
> = new noopUserData(WorkspacesStateSchema, 'WorkspacesState');

const WorkspacesStorageServiceContext = React.createContext<
  IUserData<typeof WorkspacesStateSchema>
>(noopWorkspacesStorageService);

export const WorkspacesStorageServiceProvider: React.FunctionComponent<{
  storage: IUserData<typeof WorkspacesStateSchema>;
}> = ({ storage, children }) => {
  const storageRef = useRef(storage);
  return (
    <WorkspacesStorageServiceContext.Provider value={storageRef.current}>
      {children}
    </WorkspacesStorageServiceContext.Provider>
  );
};

export const workspacesStorageServiceLocator = createServiceLocator(() => {
  const service = useContext(WorkspacesStorageServiceContext);
  return service;
}, 'workspacesStorageServiceLocator');

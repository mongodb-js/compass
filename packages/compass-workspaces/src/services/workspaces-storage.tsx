import { createServiceLocator } from '@mongodb-js/compass-app-registry';
import {
  IUserData,
  type ReadAllResult,
  z,
} from '@mongodb-js/compass-user-data';
import React, { useContext } from 'react';
import { collectionSubtabValues } from '../types';

const CollectionSubtabSchema = z.enum(collectionSubtabValues);

export const WorkspaceTabSchema = z
  .discriminatedUnion('type', [
    z.object({
      type: z.literal('Welcome'),
    }),
    z.object({
      type: z.literal('My Queries'),
    }),
    z.object({
      type: z.literal('Data Modeling'),
    }),
    z.object({
      type: z.literal('Databases'),
      connectionId: z.string(),
    }),
    z.object({
      type: z.literal('Performance'),
      connectionId: z.string(),
    }),
    z.object({
      type: z.literal('Shell'),
      connectionId: z.string(),
      initialEvaluate: z.union([z.string(), z.array(z.string())]).optional(),
      initialInput: z.string().optional(),
    }),
    z.object({
      type: z.literal('Collections'),
      connectionId: z.string(),
      namespace: z.string(),
      inferredFromPrivileges: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('Collection'),
      subTab: CollectionSubtabSchema,
      initialQuery: z.record(z.any()).optional(),
      initialPipeline: z.array(z.record(z.any())).optional(),
      initialPipelineText: z.string().optional(),
      initialAggregation: z.record(z.any()).optional(),
      editViewName: z.string().optional(),
      connectionId: z.string(),
      namespace: z.string(),
      inferredFromPrivileges: z.boolean().optional(),
    }),
  ])
  .and(
    z.object({
      id: z.string(),
    })
  );

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

export const WorkspacesStorageServiceContext = React.createContext<
  IUserData<typeof WorkspacesStateSchema>
>(noopWorkspacesStorageService);

export const workspacesStorageServiceLocator = createServiceLocator(() => {
  const service = useContext(WorkspacesStorageServiceContext);
  return service;
}, 'workspacesStorageServiceLocator');

import { z } from '@mongodb-js/compass-user-data';

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

export interface WorkspacesStorage {
  save(state: WorkspacesStateData): Promise<boolean>;
  load(): Promise<WorkspacesStateData | null>;
}

export type CompletionWithServerInfo = {
  name?: string;
  value?: string;
  type?: string | undefined;
  /** Code snippet inserted when completion is selected */
  snippet?: string;
  exactMatch?: number | undefined;
  docHTML?: string | undefined;
} & {
  /** Server version that supports the stage */
  version: string;
  /* Server version that supports using the key in $project stage */
  projectVersion?: string;
  /** Optional completion description */
  description?: string;
};

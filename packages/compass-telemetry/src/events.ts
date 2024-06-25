type GeneralPayload = Record<string, any> | undefined;
type ConnectionScopePayload = GeneralPayload & { connection_id: string };

export type PerformanceTrackingEvent =
  | 'First Contentful Paint'
  | 'Largest Contentful Paint'
  | 'First Input Delay'
  | 'Cumulative Layout Shift'
  | 'Time to First Byte';

export type EventsPayload = {
  [key in PerformanceTrackingEvent]: GeneralPayload;
} & {
  /* CONNECTION SCOPE */
  'Aggregation Canceled': ConnectionScopePayload;
  'Aggregation Edited': ConnectionScopePayload;
  'Aggregation Executed': ConnectionScopePayload;
  'Aggregation Explained': ConnectionScopePayload;
  'Aggregation Export Opened': ConnectionScopePayload;
  'Aggregation Exported': ConnectionScopePayload;
  'Aggregation Opened': ConnectionScopePayload;
  'Aggregation Saved': ConnectionScopePayload;
  'Aggregation Saved As View': ConnectionScopePayload;
  'Aggregation Side Panel Opened': ConnectionScopePayload;
  'Aggregation Timed Out': ConnectionScopePayload;
  'Aggregation Use Case Added': ConnectionScopePayload;
  'Aggregation Use Case Saved': ConnectionScopePayload;
  'AI Prompt Submitted': ConnectionScopePayload;
  'AI Query Feedback': ConnectionScopePayload;
  'AI Response Failed': ConnectionScopePayload;
  'AI Response Generated': ConnectionScopePayload;
  'Bulk Delete Executed': ConnectionScopePayload;
  'Bulk Delete Opened': ConnectionScopePayload;
  'Bulk Update Executed': ConnectionScopePayload;
  'Bulk Update Favorited': ConnectionScopePayload;
  'Bulk Update Opened': ConnectionScopePayload;
  'Collection Created': ConnectionScopePayload;
  'Connection Attempt': ConnectionScopePayload;
  'Connection Failed': ConnectionScopePayload;
  'CurrentOp showOperationDetails': ConnectionScopePayload;
  'Database Created': ConnectionScopePayload;
  'Delete Export Opened': ConnectionScopePayload;
  'Delete Exported': ConnectionScopePayload;
  'DetailView hideOperationDetails': ConnectionScopePayload;
  'DetailView killOp': ConnectionScopePayload;
  'Document Cloned': ConnectionScopePayload;
  'Document Copied': ConnectionScopePayload;
  'Document Deleted': ConnectionScopePayload;
  'Document Inserted': ConnectionScopePayload;
  'Document Updated': ConnectionScopePayload;
  'Editor Type Changed': ConnectionScopePayload;
  'Explain Plan Executed': ConnectionScopePayload;
  'Export Completed': ConnectionScopePayload;
  'Export Opened': ConnectionScopePayload;
  'Query Edited': ConnectionScopePayload;
  'Query Executed': ConnectionScopePayload;
  'Query Export Opened': ConnectionScopePayload;
  'Query Exported': ConnectionScopePayload;
  'Query History Closed': ConnectionScopePayload;
  'Query History Favorite Added': ConnectionScopePayload;
  'Query History Favorite Copied': ConnectionScopePayload;
  'Query History Favorite Removed': ConnectionScopePayload;
  'Query History Favorite Used': ConnectionScopePayload;
  'Query History Favorites': ConnectionScopePayload;
  'Query History Opened': ConnectionScopePayload;
  'Query History Recent': ConnectionScopePayload;
  'Query History Recent Used': ConnectionScopePayload;
  'Query Results Refreshed': ConnectionScopePayload;
  'Import Completed': ConnectionScopePayload;
  'Import Error Log Opened': ConnectionScopePayload;
  'Import Opened': ConnectionScopePayload;
  'Index Create Opened': ConnectionScopePayload;
  'Index Created': ConnectionScopePayload;
  'Index Dropped': ConnectionScopePayload;
  'Index Edited': ConnectionScopePayload;
  'My Queries Search': ConnectionScopePayload;
  'New Connection': ConnectionScopePayload;
  'Performance Advisor Clicked': ConnectionScopePayload;
  'Performance Paused': ConnectionScopePayload;
  'Performance Resumed': ConnectionScopePayload;
  'PipelineAI Feedback': ConnectionScopePayload;
  'Schema Analyzed': ConnectionScopePayload;
  'Schema Validation Added': ConnectionScopePayload;
  'Schema Validation Edited': ConnectionScopePayload;
  'Schema Validation Updated': ConnectionScopePayload;
  'Shell Opened': ConnectionScopePayload;
  [key: `Shell ${string}`]: ConnectionScopePayload;
  'Switch View Type': ConnectionScopePayload;
  'Update Export Opened': ConnectionScopePayload;
  'Update Exported': ConnectionScopePayload;
  'View Updated': ConnectionScopePayload;
  // unsure
  'Focus Mode Closed': ConnectionScopePayload;
  'Focus Mode Opened': ConnectionScopePayload;
  'Guide Cue Dismissed': ConnectionScopePayload;
  'Guide Cue Group Dismissed': ConnectionScopePayload;
  /* GENERAL SCOPE */
  'Application Launched': GeneralPayload;
  'Application Restart Accepted': GeneralPayload;
  'Atlas Link Clicked': GeneralPayload;
  'Atlas Sign In Error': GeneralPayload;
  'Atlas Sign In Success': GeneralPayload;
  'Atlas Sign Out': GeneralPayload;
  'Autoupdate Accepted': GeneralPayload;
  'Autoupdate Disabled': GeneralPayload;
  'Autoupdate Dismissed': GeneralPayload;
  'Autoupdate Enabled': GeneralPayload;
  'My Queries Filter': GeneralPayload;
  'My Queries Sort': GeneralPayload;
  'Theme Changed': GeneralPayload;
  'Error Fetching Attributes': GeneralPayload;
  'Aggregation Deleted': GeneralPayload;
  'Aggregation Copied': GeneralPayload;
  // unsure
  Screen: GeneralPayload; // this is a maybe.
  'Connection Exported': GeneralPayload; // looks like this is actually export of multiple connections
  'Connection Imported': GeneralPayload; // same as above
  'Keytar Secrets Migration Failed': GeneralPayload;
  'Signal Action Button Clicked': GeneralPayload;
  'Signal Closed': GeneralPayload;
  'Signal Link Clicked': GeneralPayload;
  'Signal Opened': GeneralPayload;
  'Signal Shown': GeneralPayload;
};

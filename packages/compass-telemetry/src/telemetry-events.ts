/**
 * Events that are connection scoped are associated with one connection.
 */
type ConnectionScoped<E extends { payload: unknown }> = E & {
  payload: E['payload'] & {
    /**
     * The id of the connection associated to this event.
     */
    connection_id: string;
  };
};

/**
 * This event is fired when user successfully signed in to their Atlas account
 *
 * @category Atlas
 */
type AtlasSignInSuccessEvent = {
  name: 'Atlas Sign In Success';
  payload: {
    /**
     * The id of the atlas user who signed in.
     */
    auid: string;
  };
};

/**
 * This event is fired when user failed to sign in to their Atlas account
 *
 * @category Atlas
 */
type AtlasSignInErrorEvent = {
  name: 'Atlas Sign In Error';
  payload: { error: string };
};

/**
 * This event is fired when user signed out from their Atlas account
 *
 * @category Atlas
 */
type AtlasSignOutEvent = {
  name: 'Atlas Sign Out';
  payload: { auid: string };
};

/**
 * This event is fired when user selects a use case from the aggregation panel
 *
 * @category Aggregation Builder
 */
type AggregationUseCaseAddedEvent = ConnectionScoped<{
  name: 'Aggregation Use Case Added';
  payload: {
    /**
     * Specifies if the use case was added via drag and drop
     */
    drag_and_drop?: boolean;
    stage_name?: string;
  };
}>;

/**
 * This event is fired when user adds/remove a stage or changes the stage name in the stage editor view
 *
 * @category Aggregation Builder
 */
type AggregationEditedEvent = ConnectionScoped<{
  name: 'Aggregation Edited';
  payload: {
    num_stages?: any | number;
    editor_view_type?: string | 'stage' | 'text' | 'focus';
    stage_index?: number;
    stage_action?: string;
    stage_name?: string | null;
  };
}>;

/**
 * This event is fired when user runs the aggregation
 *
 * @category Aggregation Builder
 */
type AggregationExecutedEvent = ConnectionScoped<{
  name: 'Aggregation Executed';
  payload: { num_stages: number; editor_view_type: 'stage' | 'text' | 'focus' };
}>;

/**
 * This event is fired when a user cancel a running aggregation
 *
 * @category Aggregation Builder
 */
type AggregationCanceledEvent = ConnectionScoped<{
  name: 'Aggregation Canceled';
  payload: {
    //
  };
}>;

/**
 * This event is fired when an aggregation times out
 *
 * @category Aggregation Builder
 */
type AggregationTimedOutEvent = ConnectionScoped<{
  name: 'Aggregation Timed Out';
  payload: {
    max_time_ms: number | null;
  };
}>;

/**
 * This event is fired when user saves aggregation pipeline as a view
 *
 * @category Aggregation Builder
 */
type AggregationSavedAsViewEvent = ConnectionScoped<{
  name: 'Aggregation Saved As View';
  payload: {
    /**
     * The number of stages in the aggregation.
     */
    num_stages: number;
  };
}>;

/**
 * This event is fired when user clicks to expand focus mode
 *
 * @category Aggregation Builder
 */
type FocusModeOpenedEvent = ConnectionScoped<{
  name: 'Focus Mode Opened';
  payload: { num_stages: number };
}>;

/**
 * This event is fired when user clicks to minimize focus mode
 *
 * @category Aggregation Builder
 */
type FocusModeClosedEvent = ConnectionScoped<{
  name: 'Focus Mode Closed';
  payload: { num_stages: number; duration: number };
}>;

/**
 * This event is fired when user changes editor type
 *
 * @category Aggregation Builder
 */
type EditorTypeChangedEvent = ConnectionScoped<{
  name: 'Editor Type Changed';
  payload: { num_stages: number; editor_view_type: 'stage' | 'text' | 'focus' };
}>;

/**
 * This event is fired when users saves a completed use case form, adding the stage to their pipeline
 *
 * @category Aggregation Builder
 */
type AggregationUseCaseSavedEvent = ConnectionScoped<{
  name: 'Aggregation Use Case Saved';
  payload: { stage_name: string | null };
}>;

/**
 * This event is fired when user saves aggregation pipeline
 *
 * @category Aggregation Builder
 */
type AggregationSavedEvent = ConnectionScoped<{
  name: 'Aggregation Saved';
  payload: {
    id: string;
    num_stages?: number;
    editor_view_type: 'stage' | 'text' | 'focus';
  };
}>;

/**
 * This event is fired when user opens a previously saved aggregation pipeline
 *
 * @category Aggregation Builder
 */
type AggregationOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Opened';
  payload: {
    id?: string;
    editor_view_type?: 'stage' | 'text' | 'focus';
    screen?: string;
  };
}>;

/**
 * This event is fired when user deletes a previously saved aggregation pipeline
 *
 * @category Aggregation Builder
 */
type AggregationDeletedEvent = ConnectionScoped<{
  name: 'Aggregation Deleted';
  payload: {
    id?: string;
    editor_view_type?: 'stage' | 'text' | 'focus';
    screen?: string;
  };
}>;

/**
 * This event is fired when user clicks the panel button
 *
 * @category Aggregation Builder
 */
type AggregationSidePanelOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Side Panel Opened';
  payload: { num_stages: number };
}>;

/**
 * This event is fired when user updates a view they had opened in the agg builder
 *
 * @category Aggregation Builder
 */
type ViewUpdatedEvent = ConnectionScoped<{
  name: 'View Updated';
  payload: { num_stages: number; editor_view_type: 'stage' | 'text' | 'focus' };
}>;

/**
 * This event is fired when user runs the explain plan for an aggregation
 *
 * @category Aggregation Builder
 */
type AggregationExplainedEvent = ConnectionScoped<{
  name: 'Aggregation Explained';
  payload: { num_stages: number; index_used: boolean };
}>;

/**
 * This event is fired when user opens the export to language dialog
 *
 * @category Aggregation Builder
 */
type AggregationExportOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Export Opened';
  payload: { num_stages: undefined | number };
}>;

/**
 * This event is fired when user copies to clipboard the aggregation to export
 *
 * @category Aggregation Builder
 */
type AggregationExportedEvent = ConnectionScoped<{
  name: 'Aggregation Exported';
  payload: {
    num_stages: undefined | number;
    language?:
      | 'java'
      | 'javascript'
      | 'csharp'
      | 'python'
      | 'ruby'
      | 'go'
      | 'rust'
      | 'php';
    with_import_statements?: boolean;
    with_drivers_syntax?: boolean;
    with_builders?: boolean;
  };
}>;

/**
 * This event is fired when user copied the pipeline to clipboard
 *
 * @category Aggregation Builder
 */
type AggregationCopiedEvent = {
  name: 'Aggregation Copied';
  payload: { id: string; screen: string };
};

/**
 * This event is fired when the shell is open
 *
 * @category Shell
 */
type OpenShellEvent = ConnectionScoped<{
  name: 'Open Shell';
  payload: { entrypoint?: string };
}>;

/**
 * This is a group of events forwarded from the embedded shell.
 * Every event from the shell is forwarded adding the "Shell " prefix to the original
 * event name.
 *
 * @category Shell
 */
type ShellEventEvent = ConnectionScoped<{
  name: `Shell ${string}`;
  payload: {
    mongosh_version: string;
    session_id: string;
  };
}>;

/**
 * This event is fired when an active connection is disconnected
 *
 * @category Connection
 */
type ConnectionDisconnectedEvent = ConnectionScoped<{
  name: 'Connection Disconnected';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a new connection is saved
 *
 * @category Connection
 */
type ConnectionCreatedEvent = ConnectionScoped<{
  name: 'Connection Created';
  payload: { color?: string };
}>;

/**
 * This event is fired when a connection is removed
 *
 * @category Connection
 */
type ConnectionRemovedEvent = ConnectionScoped<{
  name: 'Connection Removed';
  payload: {
    //
  };
}>;

/**
 * This event is fired when users attempts to connect to a server/cluster.
 *
 * @category Connection
 */
type ConnectionAttemptEvent = ConnectionScoped<{
  name: 'Connection Attempt';
  payload: { is_favorite: boolean; is_recent: boolean; is_new: boolean };
}>;

/**
 * This event is fired when user successfully connects to a new server/cluster.
 *
 * @category Connection
 */
type NewConnectionEvent = ConnectionScoped<{
  name: 'New Connection';
  payload: {
    is_atlas: boolean;
    atlas_hostname: string | null;
    is_local_atlas: boolean;
    is_dataLake: boolean;
    is_enterprise: boolean;
    is_genuine: boolean;
    non_genuine_server_name: string;
    server_version: string;
    server_arch: string | undefined;
    server_os_family: string | undefined;
    topology_type: string;
  };
}>;
/**
 * This event is fired when a connection attempt fails.
 *
 * @category Connection
 */
type ConnectionFailedEvent = ConnectionScoped<{
  name: 'Connection Failed';
  payload: {
    error_code: string | number | undefined;
    error_name: string;
  };
}>;

/**
 * This event is fired when connections export initiated from either UI or CLI
 *
 * @category Connection
 */
type ConnectionExportedEvent = {
  name: 'Connection Exported';
  payload: { count: number };
};

/**
 * This event is fired when connections import initiated from either UI or CLI
 *
 * @category Connection
 */
type ConnectionImportedEvent = {
  name: 'Connection Imported';
  payload: {
    /**
     * The count of imported connections.
     */
    count: any;
  };
};

/**
 * This event is fired when user copies a document to the clipboard
 *
 * @category Documents
 */
type DocumentCopiedEvent = ConnectionScoped<{
  name: 'Document Copied';
  payload: { mode: string };
}>;

/**
 * This event is fired when user deletes a document
 *
 * @category Documents
 */
type DocumentDeletedEvent = ConnectionScoped<{
  name: 'Document Deleted';
  payload: { mode: string };
}>;

/**
 * This event is fired when user updates a document
 *
 * @category Documents
 */
type DocumentUpdatedEvent = ConnectionScoped<{
  name: 'Document Updated';
  payload: { mode?: string };
}>;

/**
 * This event is fired when user clones a document
 *
 * @category Documents
 */
type DocumentClonedEvent = ConnectionScoped<{
  name: 'Document Cloned';
  payload: { mode: string };
}>;

/**
 * This event is fired when user inserts a document
 *
 * @category Documents
 */
type DocumentInsertedEvent = ConnectionScoped<{
  name: 'Document Inserted';
  payload: { mode?: string; multiple?: boolean };
}>;

/**
 * This event is fired when user explains a query
 *
 * @category Explain
 */
type ExplainPlanExecutedEvent = ConnectionScoped<{
  name: 'Explain Plan Executed';
  payload: { with_filter: boolean; index_used: boolean };
}>;

/**
 * This event is fired when a user opens the bulk update modal
 *
 * @category Bulk Operations
 */
type BulkUpdateOpenedEvent = ConnectionScoped<{
  name: 'Bulk Update Opened';
  payload: { isUpdatePreviewSupported: boolean };
}>;

/**
 * This event is fired when a user runs a bulk update operation
 *
 * @category Bulk Operations
 */
type BulkUpdateExecutedEvent = ConnectionScoped<{
  name: 'Bulk Update Executed';
  payload: { isUpdatePreviewSupported: boolean };
}>;

/**
 * This event is fired when a user opens the bulk delete modal
 *
 * @category Bulk Operations
 */
type BulkDeleteOpenedEvent = ConnectionScoped<{
  name: 'Bulk Delete Opened';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user runs a bulk delete operation
 *
 * @category Bulk Operations
 */
type BulkDeleteExecutedEvent = ConnectionScoped<{
  name: 'Bulk Delete Executed';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user runs a bulk update operation is added to
 * favorites
 *
 *
 * @category Bulk Operations
 */
type BulkUpdateFavoritedEvent = ConnectionScoped<{
  name: 'Bulk Update Favorited';
  payload: { isUpdatePreviewSupported: boolean };
}>;

/**
 * NOTE: NOT IMPLEMENTED YET.
 * This event is fired when the export to language dialog is open for an update operation.
 * TODO: https://jira.mongodb.org/browse/COMPASS-7334
 *
 * @category Bulk Operations
 */
type UpdateExportOpenedEvent = ConnectionScoped<{
  name: 'Update Export Opened';
  payload: { num_stages: undefined | number };
}>;

/**
 * NOTE: NOT IMPLEMENTED YET.
 * This event is fired when the export to language dialog is open for a delete operation.
 * TODO: https://jira.mongodb.org/browse/COMPASS-7334
 *
 * @category Bulk Operations
 */
type DeleteExportOpenedEvent = ConnectionScoped<{
  name: 'Delete Export Opened';
  payload: { num_stages: undefined | number };
}>;

/**
 * NOTE: NOT IMPLEMENTED YET.
 * This event is fired when user copies to clipboard the update query to export
 * TODO: https://jira.mongodb.org/browse/COMPASS-7334
 *
 * @category Bulk Operations
 */
type UpdateExportedEvent = ConnectionScoped<{
  name: 'Update Exported';
  payload: {
    num_stages: undefined | number;
    language?:
      | 'java'
      | 'javascript'
      | 'csharp'
      | 'python'
      | 'ruby'
      | 'go'
      | 'rust'
      | 'php';
    with_import_statements?: boolean;
    with_drivers_syntax?: boolean;
    with_builders?: boolean;
  };
}>;

/**
 * NOTE: NOT IMPLEMENTED YET.
 * This event is fired when user copies to clipboard the delete query to export
 * TODO: https://jira.mongodb.org/browse/COMPASS-7334
 *
 * @category Bulk Operations
 */
type DeleteExportedEvent = ConnectionScoped<{
  name: 'Delete Exported';
  payload: {
    num_stages: undefined | number;
    language?:
      | 'java'
      | 'javascript'
      | 'csharp'
      | 'python'
      | 'ruby'
      | 'go'
      | 'rust'
      | 'php';
    with_import_statements?: boolean;
    with_drivers_syntax?: boolean;
    with_builders?: boolean;
  };
}>;

/**
 * This event is fired when user opens the export dialog
 *
 * @category Import/Export
 */
type ExportOpenedEvent = ConnectionScoped<{
  name: 'Export Opened';
  payload: {
    type: string;
    origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
  };
}>;

/**
 * This event is fired when a data export completes
 *
 * @category Import/Export
 */
type ExportCompletedEvent = ConnectionScoped<{
  name: 'Export Completed';
  payload: {
    type: string;
    all_docs?: boolean;
    has_projection?: boolean;
    field_option?: 'all-fields' | 'select-fields';
    file_type: 'csv' | 'json';
    json_format?: 'default' | 'relaxed' | 'canonical';
    field_count?: number;
    fields_added_count?: number;
    fields_not_selected_count?: number;
    number_of_docs?: number;
    success: boolean;
    stopped: boolean;
    duration: number;
  };
}>;

/**
 * This event is fired when a data import completes
 *
 * @category Import/Export
 */
type ImportCompletedEvent = ConnectionScoped<{
  name: 'Import Completed';
  payload: {
    duration?: number;
    delimiter?: ',' | '\t' | ';' | ' ';
    newline?: '\r\n' | '\n';
    file_type?: '' | 'csv' | 'json';
    all_fields?: boolean;
    stop_on_error_selected?: boolean;
    number_of_docs: any | number;
    success?: boolean;
    aborted?: boolean;
    ignore_empty_strings?: boolean;
  };
}>;

/**
 * This event is fired when a user clicks the link to open the error log after
 * receiving import errors.
 *
 * @category Import/Export
 */
type ImportErrorLogOpenedEvent = ConnectionScoped<{
  name: 'Import Error Log Opened';
  payload: { errorCount: number };
}>;

/**
 * This event is fired when user opens the import dialog
 *
 * @category Import/Export
 */
type ImportOpenedEvent = ConnectionScoped<{
  name: 'Import Opened';
  payload: { origin: 'menu' | 'crud-toolbar' | 'empty-state' };
}>;

/**
 * This event is fired when user opens create index dialog
 *
 * @category Indexes
 */
type IndexCreateOpenedEvent = ConnectionScoped<{
  name: 'Index Create Opened';
  payload: { atlas_search?: boolean };
}>;

/**
 * This event is fired when user creates an index
 *
 * @category Indexes
 */
type IndexCreatedEvent = ConnectionScoped<{
  name: 'Index Created';
  payload: {
    unique?: boolean;
    ttl?: any;
    columnstore_index?: boolean;
    has_columnstore_projection?: any;
    has_wildcard_projection?: any;
    custom_collation?: any;
    geo?: boolean;
    atlas_search?: boolean;
    type?: string;
  };
}>;

/**
 * This event is fired when user updates an index
 *
 * @category Indexes
 */
type IndexEditedEvent = ConnectionScoped<{
  name: 'Index Edited';
  payload: { atlas_search: boolean };
}>;

/**
 * This event is fired when user drops an index
 *
 * @category Indexes
 */
type IndexDroppedEvent = ConnectionScoped<{
  name: 'Index Dropped';
  payload: { atlas_search?: boolean };
}>;

/**
 * This event is fired when a user submits feedback for a query generation
 *
 * @category Gen AI
 */
type AiQueryFeedbackEvent = ConnectionScoped<{
  name: 'AI Query Feedback';
  payload: {
    feedback: 'positive' | 'negative';
    text: string;
    request_id: string;
  };
}>;

/**
 * This event is fired when a query generation request fails with an error
 *
 * @category Gen AI
 */
type AiResponseFailedEvent = ConnectionScoped<{
  name: 'AI Response Failed';
  payload: {
    editor_view_type: 'text' | 'stages' | 'find';
    error_code?: string;
    status_code?: number;
    error_name?: string;
    request_id?: string;
  };
}>;

/**
 * This event is fired when user enters a prompt in the generative AI textbox and hits "enter
 *
 * @category Gen AI
 */
type AiPromptSubmittedEvent = ConnectionScoped<{
  name: 'AI Prompt Submitted';
  payload: {
    editor_view_type: 'text' | 'stages' | 'find';
    user_input_length?: number;
    request_id?: string;
    has_sample_documents?: boolean;
  };
}>;

/**
 * This event is fired when AI query or aggregation generated and successfully rendered in the UI
 *
 * @category Gen AI
 */
type AiResponseGeneratedEvent = ConnectionScoped<{
  name: 'AI Response Generated';
  payload: {
    editor_view_type: 'text' | 'stages' | 'find';
    syntax_errors?: boolean;
    query_shape?: (string | null)[];
    request_id?: string;
  };
}>;

/**
 * This event is fired when a user submits feedback for a pipeline generation
 *
 * @category Gen AI
 */
type PipelineAiFeedbackEvent = ConnectionScoped<{
  name: 'PipelineAI Feedback';
  payload: {
    feedback: 'positive' | 'negative';
    request_id: string;
    text: string;
  };
}>;

/**
 * This event is fired when user filters queries using db / coll filter
 *
 * @category My Queries
 */
type MyQueriesFilterEvent = {
  name: 'My Queries Filter';
  payload: { type?: string };
};

/**
 * This event is fired when user sorts items in the list using one of the sort options
 *
 * @category My Queries
 */
type MyQueriesSortEvent = {
  name: 'My Queries Sort';
  payload: {
    sort_by:
      | 'name'
      | 'id'
      | 'type'
      | 'database'
      | 'collection'
      | 'lastModified'
      | null;
    order: string;
  };
};

/**
 * This event is fired when user filters queries using search input (fires only on input blur)
 *
 * @category My Queries
 */
type MyQueriesSearchEvent = {
  name: 'My Queries Search';
  payload: {
    //
  };
};

/**
 * This event is fired when user copies to clipboard the query to export
 *
 * @category Find Queries
 */
type QueryExportedEvent = ConnectionScoped<{
  name: 'Query Exported';
  payload: {
    num_stages: undefined | number;
    language?:
      | 'java'
      | 'javascript'
      | 'csharp'
      | 'python'
      | 'ruby'
      | 'go'
      | 'rust'
      | 'php';
    with_import_statements?: boolean;
    with_drivers_syntax?: boolean;
    with_builders?: boolean;
  };
}>;

/**
 * This event is fired when user opens the export to language dialog
 *
 * @category Find Queries
 */
type QueryExportOpenedEvent = ConnectionScoped<{
  name: 'Query Export Opened';
  payload: { num_stages: undefined | number };
}>;

/**
 * This event is fired when user executes a query
 *
 * @category Find Queries
 */
type QueryExecutedEvent = ConnectionScoped<{
  name: 'Query Executed';
  payload: {
    has_projection: boolean;
    has_skip: boolean;
    has_sort: boolean;
    has_limit: boolean;
    has_collation: boolean;
    changed_maxtimems: boolean;
    collection_type: string;
    used_regex: boolean;
  };
}>;

/**
 * This event is fired when user clicks the refresh button in the UI to refresh the query results
 *
 * @category Find Queries
 */
type QueryResultsRefreshedEvent = ConnectionScoped<{
  name: 'Query Results Refreshed';
  payload: {
    //
  };
}>;

/**
 * This event is fired when user opens query history panel
 *
 * @category Find Queries
 */
type QueryHistoryOpenedEvent = ConnectionScoped<{
  name: 'Query History Opened';
  payload: {
    //
  };
}>;

/**
 * This event is fired when user closes query history panel
 *
 * @category Find Queries
 */
type QueryHistoryClosedEvent = ConnectionScoped<{
  name: 'Query History Closed';
  payload: {
    //
  };
}>;

/**
 * This event is fired when user selects a favorite query to put it in the query bar
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteUsedEvent = ConnectionScoped<{
  name: 'Query History Favorite Used';
  payload: { id?: string; screen?: string; isUpdateQuery?: boolean };
}>;

/**
 * This event is fired when user removes query from favorites
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteRemovedEvent = ConnectionScoped<{
  name: 'Query History Favorite Removed';
  payload: { id?: string; screen?: string; isUpdateQuery?: boolean };
}>;

/**
 * This event is fired when user selects "favorites" in query history panel
 *
 * @category Find Queries
 */
type QueryHistoryFavoritesEvent = ConnectionScoped<{
  name: 'Query History Favorites';
  payload: {
    //
  };
}>;

/**
 * This event is fired when user selects "recent" in query history panel
 *
 * @category Find Queries
 */
type QueryHistoryRecentEvent = ConnectionScoped<{
  name: 'Query History Recent';
  payload: {
    //
  };
}>;

/**
 * This event is fired when user selects a recent query to put it in the query bar
 *
 * @category Find Queries
 */
type QueryHistoryRecentUsedEvent = ConnectionScoped<{
  name: 'Query History Recent Used';
  payload: { isUpdateQuery: boolean };
}>;

/**
 * This event is fired when user favorites a recent query
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteAddedEvent = ConnectionScoped<{
  name: 'Query History Favorite Added';
  payload: { isUpdateQuery: boolean };
}>;

/**
 * This event is fired when a user edits a query
 *
 * @category Find Queries
 */
type QueryEditedEvent = ConnectionScoped<{
  name: 'Query Edited';
  payload: { option_name: any };
}>;

/**
 * This event is fired when user copied query to clipboard
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteCopiedEvent = {
  name: 'Query History Favorite Copied';
  payload: { id: string; screen: string };
};

/**
 * This event is fired when user edits validation rules
 *
 * @category Schema Validation
 */
type SchemaValidationEditedEvent = ConnectionScoped<{
  name: 'Schema Validation Edited';
  payload: { json_schema: boolean };
}>;

/**
 * This event is fired when user saves validation rules
 *
 * @category Schema Validation
 */
type SchemaValidationUpdatedEvent = ConnectionScoped<{
  name: 'Schema Validation Updated';
  payload: {
    validation_action: 'error' | 'warn';
    validation_level: 'off' | 'moderate' | 'strict';
  };
}>;

/**
 * This event is fired when user adds validation rules
 *
 * @category Schema Validation
 */
type SchemaValidationAddedEvent = ConnectionScoped<{
  name: 'Schema Validation Added';
  payload: {
    //
  };
}>;

/**
 * This event is fired when user analyzes the schema
 *
 * @category Schema
 */
type SchemaAnalyzedEvent = ConnectionScoped<{
  name: 'Schema Analyzed';
  payload: {
    with_filter: boolean;
    schema_width: any;
    schema_depth: number;
    geo_data: boolean;
    analysis_time_ms: number;
  };
}>;

/**
 * This event is fired when a user clicks to show the details of an operation
 *
 * @category Performance Tab
 */
type CurrentOpShowOperationDetailsEvent = ConnectionScoped<{
  name: 'CurrentOp showOperationDetails';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user clicks to hide the details of an operation
 *
 * @category Performance Tab
 */
type DetailViewHideOperationDetailsEvent = ConnectionScoped<{
  name: 'DetailView hideOperationDetails';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user clicks to kill an operation
 *
 * @category Performance Tab
 */
type DetailViewKillOpEvent = ConnectionScoped<{
  name: 'DetailView killOp';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user resumes a paused performance screen
 *
 * @category Performance Tab
 */
type PerformanceResumedEvent = ConnectionScoped<{
  name: 'Performance Resumed';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user pauses the performance screen
 *
 * @category Performance Tab
 */
type PerformancePausedEvent = ConnectionScoped<{
  name: 'Performance Paused';
  payload: {
    //
  };
}>;

/**
 * This event is fired when a user clicks "next" on a guide cue.
 *
 * @category Guide Cues
 */
type GuideCueDismissedEvent = {
  name: 'Guide Cue Dismissed';
  payload: { groupId: any; cueId: any; step: any };
};

/**
 * This event is fired when a user clicks "next" on the last guide cue of a
 * guide cue group.
 *
 * @category Guide Cues
 */
type GuideCueGroupDismissedEvent = {
  name: 'Guide Cue Group Dismissed';
  payload: { groupId: any; cueId: any; step: any };
};

/**
 * This event is fired when signal icon badge is rendered on the screen visible to the user.
 *
 * @category Proactive Performance Insights
 */
type SignalShownEvent = {
  name: 'Signal Shown';
  payload: { id: any };
};

/**
 * This event is fired when signal badge is clicked and popup is opened.
 *
 * @category Proactive Performance Insights
 */
type SignalOpenedEvent = {
  name: 'Signal Opened';
  payload: { id: any };
};

/**
 * This event is fired when Action button for the signal is clicked inside the popup.
 *
 * @category Proactive Performance Insights
 */
type SignalActionButtonClickedEvent = {
  name: 'Signal Action Button Clicked';
  payload: { id: any };
};

/**
 * This event is fired when "Learn more" link is clicked inside the signal popup.
 *
 * @category Proactive Performance Insights
 */
type SignalLinkClickedEvent = {
  name: 'Signal Link Clicked';
  payload: { id: any };
};

/**
 * This event is fired when user clicked the close button or outside the signal and closed the popup.
 *
 * @category Proactive Performance Insights
 */
type SignalClosedEvent = {
  name: 'Signal Closed';
  payload: { id: any };
};

/**
 * This event is fired when "Update available" popup is shown and user accepts the update.
 *
 * @category Autoupdates
 */
type AutoupdateAcceptedEvent = {
  name: 'Autoupdate Accepted';
  payload: {
    update_version?: string;
    manual_update?: boolean;
    manual_download?: boolean;
  };
};

/** This event is fired when the user accepts to restart the application from
 * the update popup.
 *
 * @category Autoupdates
 */
type ApplicationRestartAcceptedEvent = {
  name: 'Application Restart Accepted';
  payload: Record<string, never>;
};

/** This event is fired when the auto-update feature is enabled.
 *
 * @category Autoupdates
 */
type AutoupdateEnabledEvent = {
  name: 'Autoupdate Enabled';
  payload: Record<string, never>;
};

/** This event is fired when the auto-update feature is disabled.
 *
 * @category Autoupdates
 */
type AutoupdateDisabledEvent = {
  name: 'Autoupdate Disabled';
  payload: Record<string, never>;
};

/**
 * This event is fired when "Update available" popup is shown and user rejects
 * the update.
 *
 * @category Autoupdates
 */
type AutoupdateDismissedEvent = {
  name: 'Autoupdate Dismissed';
  payload: { update_version: string };
};

/**
 * This event is fired when user changes items view type between list and grid.
 *
 * @category Database / Collection List
 */
type SwitchViewTypeEvent = ConnectionScoped<{
  name: 'Switch View Type';
  payload: { view_type: any; item_type: 'collection' | 'database' };
}>;

/**
 * This event is fired when a collection is created.
 *
 * @category Database / Collection List
 */
type CollectionCreatedEvent = ConnectionScoped<{
  name: 'Collection Created';
  payload: {
    is_capped: boolean;
    has_collation: boolean;
    is_timeseries: boolean;
    is_clustered: boolean;
    is_fle2: boolean;
    expires: boolean;
  };
}>;

/**
 * This event is fired when a database is created.
 *
 * @category Database / Collection List
 */
type DatabaseCreatedEvent = ConnectionScoped<{
  name: 'Database Created';
  payload: {
    is_capped: boolean;
    has_collation: boolean;
    is_timeseries: boolean;
    is_clustered: boolean;
    is_fle2: boolean;
    expires: boolean;
  };
}>;

/**
 * This event is fired when a user changes theme.
 *
 * @category Settings
 */
type ThemeChangedEvent = {
  name: 'Theme Changed';
  payload: { theme: 'DARK' | 'LIGHT' | 'OS_THEME' };
};

/**
 * This event is fired at startup to report the First Contentful Paint metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type FirstContentfulPaintEvent = {
  name: 'First Contentful Paint';
  payload: { value: number };
};

/**
 * This event is fired at startup to report the Largest Contentful Paint metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type LargestContentfulPaintEvent = {
  name: 'Largest Contentful Paint';
  payload: { value: number };
};

/**
 * This event is fired at startup to report the First Input Delay metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type FirstInputDelayEvent = {
  name: 'First Input Delay';
  payload: { value: number };
};

/**
 * This event is fired at startup to report the Cumulative Layout Shift metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type CumulativeLayoutShiftEvent = {
  name: 'Cumulative Layout Shift';
  payload: { value: number };
};

/**
 * This event is fired at startup to report the Time to First Byte metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type TimeToFirstByteEvent = {
  name: 'Time to First Byte';
  payload: { value: number };
};

/**
 * This event is fired when user clicks on Atlas CTA
 *
 * @category Other
 */
type AtlasLinkClickedEvent = {
  name: 'Atlas Link Clicked';
  payload: { screen?: string };
};

/**
 * This event is fired when application launch initiated.
 *
 * @category Other
 */
type ApplicationLaunchedEvent = {
  name: 'Application Launched';
  payload: {
    context: string;
    launch_connection: string;
    protected: boolean | undefined;
    readOnly: boolean;
    maxTimeMS: number | undefined;
    global_config: boolean;
    cli_args: boolean;
    legacy_connections: boolean;
  };
};

/**
 * This event is fired when the keytar migration fails for a user.
 * See: https://jira.mongodb.org/browse/COMPASS-6856.
 *
 * NOTE: should be removed as part of https://jira.mongodb.org/browse/COMPASS-7948.
 *
 * @category Other
 */
type KeytarSecretsMigrationFailedEvent = {
  name: 'Keytar Secrets Migration Failed';
  payload: { num_saved_connections: number; num_failed_connections: number };
};

/**
 * This event is fired when we fail to track another event due to an exception
 * while building the attributes
 *
 * @category Other
 */
type ErrorFetchingAttributesEvent = {
  name: 'Error Fetching Attributes';
  payload: { event_name: string };
};

/**
 * This event is fired when user activates (i.e. goes to) a screen
 *
 * @category Other
 */
type ScreenEvent = ConnectionScoped<{
  name: 'Screen';
  payload: { name?: string };
}>;

/**
 * This event is fired when a user clicks on the Performance Advisor CTA
 *
 * @category Other
 */
type PerformanceAdvisorClickedEvent = ConnectionScoped<{
  name: 'Performance Advisor Clicked';
  payload: Record<string, never>;
}>;

/**
 * This event is fired at startup when we detect that the application is running on
 * a system that doesn't offer a suitable secret storage backend.
 *
 * @category Other
 */
type SecretStorageNotAvailable = {
  name: 'Secret Storage Not Available';
  payload: Record<string, never>;
};

export type TelemetryEvent =
  | AggregationCanceledEvent
  | AggregationCopiedEvent
  | AggregationDeletedEvent
  | AggregationEditedEvent
  | AggregationExecutedEvent
  | AggregationExplainedEvent
  | AggregationExportedEvent
  | AggregationExportOpenedEvent
  | AggregationOpenedEvent
  | AggregationSavedAsViewEvent
  | AggregationSavedEvent
  | AggregationSidePanelOpenedEvent
  | AggregationTimedOutEvent
  | AggregationUseCaseAddedEvent
  | AggregationUseCaseSavedEvent
  | AiPromptSubmittedEvent
  | AiQueryFeedbackEvent
  | AiResponseFailedEvent
  | AiResponseGeneratedEvent
  | ApplicationLaunchedEvent
  | AtlasLinkClickedEvent
  | AtlasSignInErrorEvent
  | AtlasSignInSuccessEvent
  | AtlasSignOutEvent
  | AutoupdateAcceptedEvent
  | AutoupdateDismissedEvent
  | ApplicationRestartAcceptedEvent
  | AutoupdateEnabledEvent
  | AutoupdateDisabledEvent
  | BulkDeleteExecutedEvent
  | BulkDeleteOpenedEvent
  | BulkUpdateExecutedEvent
  | BulkUpdateFavoritedEvent
  | BulkUpdateOpenedEvent
  | CollectionCreatedEvent
  | ConnectionAttemptEvent
  | ConnectionCreatedEvent
  | ConnectionDisconnectedEvent
  | ConnectionExportedEvent
  | ConnectionFailedEvent
  | ConnectionImportedEvent
  | ConnectionRemovedEvent
  | CurrentOpShowOperationDetailsEvent
  | DatabaseCreatedEvent
  | DeleteExportedEvent
  | DeleteExportOpenedEvent
  | DetailViewHideOperationDetailsEvent
  | DetailViewKillOpEvent
  | DocumentClonedEvent
  | DocumentCopiedEvent
  | DocumentDeletedEvent
  | DocumentInsertedEvent
  | DocumentUpdatedEvent
  | EditorTypeChangedEvent
  | ErrorFetchingAttributesEvent
  | ExplainPlanExecutedEvent
  | ExportCompletedEvent
  | ExportOpenedEvent
  | FocusModeClosedEvent
  | FocusModeOpenedEvent
  | GuideCueDismissedEvent
  | GuideCueGroupDismissedEvent
  | ImportCompletedEvent
  | ImportErrorLogOpenedEvent
  | ImportOpenedEvent
  | IndexCreatedEvent
  | IndexCreateOpenedEvent
  | IndexDroppedEvent
  | IndexEditedEvent
  | KeytarSecretsMigrationFailedEvent
  | MyQueriesFilterEvent
  | MyQueriesSearchEvent
  | MyQueriesSortEvent
  | NewConnectionEvent
  | OpenShellEvent
  | PerformanceAdvisorClickedEvent
  | PerformancePausedEvent
  | PerformanceResumedEvent
  | PipelineAiFeedbackEvent
  | QueryEditedEvent
  | QueryExecutedEvent
  | QueryExportedEvent
  | QueryExportOpenedEvent
  | QueryHistoryClosedEvent
  | QueryHistoryFavoriteAddedEvent
  | QueryHistoryFavoriteCopiedEvent
  | QueryHistoryFavoriteRemovedEvent
  | QueryHistoryFavoritesEvent
  | QueryHistoryFavoriteUsedEvent
  | QueryHistoryOpenedEvent
  | QueryHistoryRecentEvent
  | QueryHistoryRecentUsedEvent
  | QueryResultsRefreshedEvent
  | SchemaAnalyzedEvent
  | SchemaValidationAddedEvent
  | SchemaValidationEditedEvent
  | SchemaValidationUpdatedEvent
  | ScreenEvent
  | ShellEventEvent
  | SignalActionButtonClickedEvent
  | SignalClosedEvent
  | SignalLinkClickedEvent
  | SignalOpenedEvent
  | SignalShownEvent
  | SwitchViewTypeEvent
  | ThemeChangedEvent
  | UpdateExportedEvent
  | UpdateExportOpenedEvent
  | ViewUpdatedEvent
  | SecretStorageNotAvailable
  | FirstContentfulPaintEvent
  | LargestContentfulPaintEvent
  | FirstInputDelayEvent
  | CumulativeLayoutShiftEvent
  | TimeToFirstByteEvent;

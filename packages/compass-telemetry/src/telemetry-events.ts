type ConnectionScoped<E extends { payload: unknown }> = E & {
  payload: E['payload'] & { connection_id: string };
};

type ErrorFetchingAttributesEvent = {
  name: 'Error Fetching Attributes';
  payload: { event_name: string };
};

type AtlasSignInSuccessEvent = {
  name: 'Atlas Sign In Success';
  payload: { auid: string };
};

type AtlasSignInErrorEvent = {
  name: 'Atlas Sign In Error';
  payload: { error: string };
};

type AtlasSignOutEvent = {
  name: 'Atlas Sign Out';
  payload: { auid: string };
};

type AggregationUseCaseAddedEvent = ConnectionScoped<{
  name: 'Aggregation Use Case Added';
  payload: { drag_and_drop?: boolean; stage_name?: string };
}>;

type ScreenEvent = ConnectionScoped<{
  name: 'Screen';
  payload: { name?: string };
}>;

type AggregationEditedEvent = ConnectionScoped<{
  name: 'Aggregation Edited';
  payload: {
    num_stages?: any | number;
    editor_view_type?: string | 'stage' | 'text' | 'focus';
    stage_index?: number;
    stage_action?: string;
    stage_name?: string;
  };
}>;

type PipelineAiFeedbackEvent = ConnectionScoped<{
  name: 'PipelineAI Feedback';
  payload: {
    feedback: 'positive' | 'negative';
    request_id: string;
    text: string;
  };
}>;

type AtlasLinkClickedEvent = {
  name: 'Atlas Link Clicked';
  payload: { screen?: string };
};

type AggregationExecutedEvent = ConnectionScoped<{
  name: 'Aggregation Executed';
  payload: { num_stages: number; editor_view_type: 'stage' | 'text' | 'focus' };
}>;

type AggregationCanceledEvent = ConnectionScoped<{
  name: 'Aggregation Canceled';
  payload: {
    //
  };
}>;

type AggregationTimedOutEvent = ConnectionScoped<{
  name: 'Aggregation Timed Out';
  payload: { max_time_ms: number };
}>;

type AggregationSavedAsViewEvent = ConnectionScoped<{
  name: 'Aggregation Saved As View';
  payload: { num_stages: number };
}>;

type FocusModeOpenedEvent = ConnectionScoped<{
  name: 'Focus Mode Opened';
  payload: { num_stages: number };
}>;

type FocusModeClosedEvent = ConnectionScoped<{
  name: 'Focus Mode Closed';
  payload: { num_stages: number; duration: number };
}>;

type AiResponseFailedEvent = ConnectionScoped<{
  name: 'AI Response Failed';
  payload: {
    editor_view_type: 'text' | 'stages' | string;
    error_code?: string;
    status_code?: number;
    error_name?: string;
    request_id?: string;
  };
}>;

type AiPromptSubmittedEvent = ConnectionScoped<{
  name: 'AI Prompt Submitted';
  payload: {
    editor_view_type?: string;
    user_input_length?: number;
    request_id?: string;
    has_sample_documents?: boolean;
  };
}>;

type AiResponseGeneratedEvent = ConnectionScoped<{
  name: 'AI Response Generated';
  payload: {
    editor_view_type?: string;
    syntax_errors?: boolean;
    query_shape?: string[];
    request_id?: string;
  };
}>;

type EditorTypeChangedEvent = ConnectionScoped<{
  name: 'Editor Type Changed';
  payload: { num_stages: number; editor_view_type: 'stage' | 'text' | 'focus' };
}>;

type AggregationUseCaseSavedEvent = ConnectionScoped<{
  name: 'Aggregation Use Case Saved';
  payload: { stage_name: string };
}>;

type AggregationSavedEvent = ConnectionScoped<{
  name: 'Aggregation Saved';
  payload: {
    id: string;
    num_stages: number;
    editor_view_type: 'stage' | 'text' | 'focus';
  };
}>;

type AggregationOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Opened';
  payload: {
    id?: string;
    editor_view_type?: 'stage' | 'text' | 'focus';
    screen?: string;
  };
}>;

type AggregationDeletedEvent = ConnectionScoped<{
  name: 'Aggregation Deleted';
  payload: {
    id?: string;
    editor_view_type?: 'stage' | 'text' | 'focus';
    screen?: string;
  };
}>;

type AggregationSidePanelOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Side Panel Opened';
  payload: { num_stages: number };
}>;

type ViewUpdatedEvent = ConnectionScoped<{
  name: 'View Updated';
  payload: { num_stages: number; editor_view_type: 'stage' | 'text' | 'focus' };
}>;

type OpenShellEvent = ConnectionScoped<{
  name: 'Open Shell';
  payload: { entrypoint?: string };
}>;

type ConnectionDisconnectedEvent = ConnectionScoped<{
  name: 'Connection Disconnected';
  payload: {
    //
  };
}>;

type ConnectionCreatedEvent = ConnectionScoped<{
  name: 'Connection Created';
  payload: { color: string };
}>;

type ConnectionRemovedEvent = ConnectionScoped<{
  name: 'Connection Removed';
  payload: {
    //
  };
}>;

type QueryResultsRefreshedEvent = ConnectionScoped<{
  name: 'Query Results Refreshed';
  payload: {
    //
  };
}>;

type DocumentCopiedEvent = ConnectionScoped<{
  name: 'Document Copied';
  payload: { mode: string };
}>;

type DocumentDeletedEvent = ConnectionScoped<{
  name: 'Document Deleted';
  payload: { mode: string };
}>;

type DocumentUpdatedEvent = ConnectionScoped<{
  name: 'Document Updated';
  payload: { mode?: string };
}>;

type DocumentClonedEvent = ConnectionScoped<{
  name: 'Document Cloned';
  payload: { mode: string };
}>;

type BulkUpdateOpenedEvent = ConnectionScoped<{
  name: 'Bulk Update Opened';
  payload: { isUpdatePreviewSupported: boolean };
}>;

type BulkUpdateExecutedEvent = ConnectionScoped<{
  name: 'Bulk Update Executed';
  payload: { isUpdatePreviewSupported: boolean };
}>;

type DocumentInsertedEvent = ConnectionScoped<{
  name: 'Document Inserted';
  payload: { mode?: string; multiple?: boolean };
}>;

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

type BulkDeleteOpenedEvent = ConnectionScoped<{
  name: 'Bulk Delete Opened';
  payload: {
    //
  };
}>;

type BulkDeleteExecutedEvent = ConnectionScoped<{
  name: 'Bulk Delete Executed';
  payload: {
    //
  };
}>;

type BulkUpdateFavoritedEvent = ConnectionScoped<{
  name: 'Bulk Update Favorited';
  payload: { isUpdatePreviewSupported: boolean };
}>;

type AggregationExplainedEvent = ConnectionScoped<{
  name: 'Aggregation Explained';
  payload: { num_stages: number; index_used: boolean };
}>;

type ExplainPlanExecutedEvent = ConnectionScoped<{
  name: 'Explain Plan Executed';
  payload: { with_filter: boolean; index_used: boolean };
}>;

type UpdateExportOpenedEvent = ConnectionScoped<{
  name: 'Update Export Opened';
  payload: { num_stages: undefined | number };
}>;

type DeleteExportOpenedEvent = ConnectionScoped<{
  name: 'Delete Export Opened';
  payload: { num_stages: undefined | number };
}>;

type QueryExportOpenedEvent = ConnectionScoped<{
  name: 'Query Export Opened';
  payload: { num_stages: undefined | number };
}>;

type AggregationExportOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Export Opened';
  payload: { num_stages: undefined | number };
}>;

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

type ExportOpenedEvent = ConnectionScoped<{
  name: 'Export Opened';
  payload: {
    type: string;
    origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
  };
}>;

type ExportCompletedEvent = ConnectionScoped<{
  name: 'Export Completed';
  payload: {
    type: string;
    all_docs: boolean;
    has_projection: boolean;
    field_option: 'all-fields' | 'select-fields';
    file_type: 'csv' | 'json';
    json_format: 'default' | 'relaxed' | 'canonical';
    field_count: number;
    fields_added_count: number;
    fields_not_selected_count: number;
    number_of_docs: number;
    success: boolean;
    stopped: boolean;
    duration: number;
  };
}>;

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

type ImportErrorLogOpenedEvent = ConnectionScoped<{
  name: 'Import Error Log Opened';
  payload: { errorCount: number };
}>;

type ImportOpenedEvent = ConnectionScoped<{
  name: 'Import Opened';
  payload: { origin: 'menu' | 'crud-toolbar' | 'empty-state' };
}>;

type IndexCreateOpenedEvent = ConnectionScoped<{
  name: 'Index Create Opened';
  payload: { atlas_search?: boolean };
}>;

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

type IndexEditedEvent = ConnectionScoped<{
  name: 'Index Edited';
  payload: { atlas_search: boolean };
}>;

type IndexDroppedEvent = ConnectionScoped<{
  name: 'Index Dropped';
  payload: { atlas_search?: boolean };
}>;

type AiQueryFeedbackEvent = ConnectionScoped<{
  name: 'AI Query Feedback';
  payload: {
    feedback: 'positive' | 'negative';
    text: string;
    request_id: string;
  };
}>;

type QueryHistoryOpenedEvent = ConnectionScoped<{
  name: 'Query History Opened';
  payload: {
    //
  };
}>;

type QueryHistoryClosedEvent = ConnectionScoped<{
  name: 'Query History Closed';
  payload: {
    //
  };
}>;

type QueryHistoryFavoriteUsedEvent = ConnectionScoped<{
  name: 'Query History Favorite Used';
  payload: { id?: string; screen?: string; isUpdateQuery?: boolean };
}>;

type QueryHistoryFavoriteRemovedEvent = ConnectionScoped<{
  name: 'Query History Favorite Removed';
  payload: { id?: string; screen?: string; isUpdateQuery?: boolean };
}>;

type QueryHistoryFavoritesEvent = ConnectionScoped<{
  name: 'Query History Favorites';
  payload: {
    //
  };
}>;

type QueryHistoryRecentEvent = ConnectionScoped<{
  name: 'Query History Recent';
  payload: {
    //
  };
}>;

type QueryHistoryRecentUsedEvent = ConnectionScoped<{
  name: 'Query History Recent Used';
  payload: { isUpdateQuery: boolean };
}>;

type QueryHistoryFavoriteAddedEvent = ConnectionScoped<{
  name: 'Query History Favorite Added';
  payload: { isUpdateQuery: boolean };
}>;

type QueryEditedEvent = ConnectionScoped<{
  name: 'Query Edited';
  payload: { option_name: any };
}>;

type MyQueriesFilterEvent = {
  name: 'My Queries Filter';
  payload: { type?: string };
};

type MyQueriesSortEvent = {
  name: 'My Queries Sort';
  payload: {
    sort_by:
      | 'name'
      | 'id'
      | 'type'
      | 'database'
      | 'collection'
      | 'lastModified';
    order: string;
  };
};

type MyQueriesSearchEvent = {
  name: 'My Queries Search';
  payload: {
    //
  };
};

type AggregationCopiedEvent = {
  name: 'Aggregation Copied';
  payload: { id: string; screen: string };
};

type QueryHistoryFavoriteCopiedEvent = {
  name: 'Query History Favorite Copied';
  payload: { id: string; screen: string };
};

type SchemaValidationEditedEvent = ConnectionScoped<{
  name: 'Schema Validation Edited';
  payload: { json_schema: boolean };
}>;

type SchemaValidationUpdatedEvent = ConnectionScoped<{
  name: 'Schema Validation Updated';
  payload: {
    validation_action: 'error' | 'warn';
    validation_level: 'off' | 'moderate' | 'strict';
  };
}>;

type SchemaValidationAddedEvent = ConnectionScoped<{
  name: 'Schema Validation Added';
  payload: {
    //
  };
}>;

type PerformanceAdvisorClickedEvent = ConnectionScoped<{
  name: 'Performance Advisor Clicked';
  payload: {
    //
  };
}>;

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

type CurrentOpShowOperationDetailsEvent = ConnectionScoped<{
  name: 'CurrentOp showOperationDetails';
  payload: {
    //
  };
}>;

type DetailViewHideOperationDetailsEvent = ConnectionScoped<{
  name: 'DetailView hideOperationDetails';
  payload: {
    //
  };
}>;

type DetailViewKillOpEvent = ConnectionScoped<{
  name: 'DetailView killOp';
  payload: {
    //
  };
}>;

type PerformanceResumedEvent = ConnectionScoped<{
  name: 'Performance Resumed';
  payload: {
    //
  };
}>;

type PerformancePausedEvent = ConnectionScoped<{
  name: 'Performance Paused';
  payload: {
    //
  };
}>;

type ShellEventEvent = ConnectionScoped<{
  name: 'Shell Event';
  payload: {
    shell_event_name: string;
    mongosh_version: string;
    session_id: string;
  };
}>;

type GuideCueDismissedEvent = {
  name: 'Guide Cue Dismissed';
  payload: { groupId: any; cueId: any; step: any };
};

type GuideCueGroupDismissedEvent = {
  name: 'Guide Cue Group Dismissed';
  payload: { groupId: any; cueId: any; step: any };
};

type SignalShownEvent = {
  name: 'Signal Shown';
  payload: { id: any };
};

type SignalOpenedEvent = {
  name: 'Signal Opened';
  payload: { id: any };
};

type SignalActionButtonClickedEvent = {
  name: 'Signal Action Button Clicked';
  payload: { id: any };
};

type SignalLinkClickedEvent = {
  name: 'Signal Link Clicked';
  payload: { id: any };
};

type SignalClosedEvent = {
  name: 'Signal Closed';
  payload: { id: any };
};

type StringEvent = {
  name: 'string';
  payload: { value: number };
};

type ConnectionAttemptEvent = ConnectionScoped<{
  name: 'Connection Attempt';
  payload: { is_favorite: boolean; is_recent: boolean; is_new: boolean };
}>;

type NewConnectionEvent = ConnectionScoped<{
  name: 'New Connection';
  payload: {
    is_atlas: boolean;
    atlas_hostname: string;
    is_local_atlas: boolean;
    is_dataLake: boolean;
    is_enterprise: boolean;
    is_genuine: boolean;
    non_genuine_server_name: string;
    server_version: string;
    server_arch: string;
    server_os_family: string;
    topology_type: string;
  };
}>;

type ConnectionFailedEvent = ConnectionScoped<{
  name: 'Connection Failed';
  payload: { error_code: string | number; error_name: string };
}>;

type ApplicationLaunchedEvent = {
  name: 'Application Launched';
  payload: {
    context: string;
    launch_connection: string;
    protected: boolean;
    readOnly: boolean;
    maxTimeMS: number;
    global_config: boolean;
    cli_args: boolean;
    legacy_connections: boolean;
  };
};

type AutoupdateAcceptedEvent = {
  name: 'Autoupdate Accepted';
  payload: {
    update_version?: string;
    manual_update?: boolean;
    manual_download?: boolean;
  };
};

type AutoupdateDismissedEvent = {
  name: 'Autoupdate Dismissed';
  payload: { update_version: string };
};

type ThemeChangedEvent = {
  name: 'Theme Changed';
  payload: { theme: 'DARK' | 'LIGHT' | 'OS_THEME' };
};

type KeytarSecretsMigrationFailedEvent = {
  name: 'Keytar Secrets Migration Failed';
  payload: { num_saved_connections: number; num_failed_connections: number };
};

type ConnectionExportedEvent = {
  name: 'Connection Exported';
  payload: { count: number };
};

type ConnectionImportedEvent = {
  name: 'Connection Imported';
  payload: { count: any };
};

type SwitchViewTypeEvent = ConnectionScoped<{
  name: 'Switch View Type';
  payload: { view_type: any; item_type: 'collection' | 'database' };
}>;

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

export type TelemetryEvent =
  | ErrorFetchingAttributesEvent
  | AtlasSignInSuccessEvent
  | AtlasSignInErrorEvent
  | AtlasSignOutEvent
  | AggregationUseCaseAddedEvent
  | ScreenEvent
  | AggregationEditedEvent
  | PipelineAiFeedbackEvent
  | AtlasLinkClickedEvent
  | AggregationExecutedEvent
  | AggregationCanceledEvent
  | AggregationTimedOutEvent
  | AggregationSavedAsViewEvent
  | FocusModeOpenedEvent
  | FocusModeClosedEvent
  | AiResponseFailedEvent
  | AiPromptSubmittedEvent
  | AiResponseGeneratedEvent
  | EditorTypeChangedEvent
  | AggregationUseCaseSavedEvent
  | AggregationSavedEvent
  | AggregationOpenedEvent
  | AggregationDeletedEvent
  | AggregationSidePanelOpenedEvent
  | ViewUpdatedEvent
  | OpenShellEvent
  | ConnectionDisconnectedEvent
  | ConnectionCreatedEvent
  | ConnectionRemovedEvent
  | QueryResultsRefreshedEvent
  | DocumentCopiedEvent
  | DocumentDeletedEvent
  | DocumentUpdatedEvent
  | DocumentClonedEvent
  | BulkUpdateOpenedEvent
  | BulkUpdateExecutedEvent
  | DocumentInsertedEvent
  | QueryExecutedEvent
  | BulkDeleteOpenedEvent
  | BulkDeleteExecutedEvent
  | BulkUpdateFavoritedEvent
  | AggregationExplainedEvent
  | ExplainPlanExecutedEvent
  | UpdateExportOpenedEvent
  | DeleteExportOpenedEvent
  | QueryExportOpenedEvent
  | AggregationExportOpenedEvent
  | UpdateExportedEvent
  | DeleteExportedEvent
  | QueryExportedEvent
  | AggregationExportedEvent
  | ExportOpenedEvent
  | ExportCompletedEvent
  | ImportCompletedEvent
  | ImportErrorLogOpenedEvent
  | ImportOpenedEvent
  | IndexCreateOpenedEvent
  | IndexCreatedEvent
  | IndexEditedEvent
  | IndexDroppedEvent
  | AiQueryFeedbackEvent
  | QueryHistoryOpenedEvent
  | QueryHistoryClosedEvent
  | QueryHistoryFavoriteUsedEvent
  | QueryHistoryFavoriteRemovedEvent
  | QueryHistoryFavoritesEvent
  | QueryHistoryRecentEvent
  | QueryHistoryRecentUsedEvent
  | QueryHistoryFavoriteAddedEvent
  | QueryEditedEvent
  | MyQueriesFilterEvent
  | MyQueriesSortEvent
  | MyQueriesSearchEvent
  | AggregationCopiedEvent
  | QueryHistoryFavoriteCopiedEvent
  | SchemaValidationEditedEvent
  | SchemaValidationUpdatedEvent
  | SchemaValidationAddedEvent
  | PerformanceAdvisorClickedEvent
  | SchemaAnalyzedEvent
  | CurrentOpShowOperationDetailsEvent
  | DetailViewHideOperationDetailsEvent
  | DetailViewKillOpEvent
  | PerformanceResumedEvent
  | PerformancePausedEvent
  | ShellEventEvent
  | GuideCueDismissedEvent
  | GuideCueGroupDismissedEvent
  | SignalShownEvent
  | SignalOpenedEvent
  | SignalActionButtonClickedEvent
  | SignalLinkClickedEvent
  | SignalClosedEvent
  | StringEvent
  | ConnectionAttemptEvent
  | NewConnectionEvent
  | ConnectionFailedEvent
  | ApplicationLaunchedEvent
  | AutoupdateAcceptedEvent
  | AutoupdateDismissedEvent
  | ThemeChangedEvent
  | KeytarSecretsMigrationFailedEvent
  | ConnectionExportedEvent
  | ConnectionImportedEvent
  | SwitchViewTypeEvent
  | CollectionCreatedEvent
  | DatabaseCreatedEvent;

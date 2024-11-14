/**
 * Traits sent along with the Segment identify call
 */
export type IdentifyTraits = {
  /**
   * Shortened version number (e.g., '1.29').
   */
  compass_version: string;

  /**
   * The full version of the Compass application, including additional identifiers
   * such as build metadata or pre-release tags (e.g., '1.29.0-beta.1').
   */
  compass_full_version: string;

  /**
   * The distribution of Compass being used.
   */
  compass_distribution: 'compass' | 'compass-readonly' | 'compass-isolated';

  /**
   * The release channel of Compass.
   * - 'stable' for the general release.
   * - 'beta' for pre-release versions intended for testing.
   * - 'dev' for development versions only distributed internally.
   */
  compass_channel: 'stable' | 'beta' | 'dev';

  /**
   * The platform on which Compass is running, derived from Node.js `os.platform()`.
   * Corresponds to the operating system (e.g., 'darwin' for macOS, 'win32' for Windows, 'linux' for Linux).
   */
  platform: string;

  /**
   * The architecture of the system's processor, derived from Node.js `os.arch()`.
   * 'x64' for 64-bit processors and 'arm' for ARM processors.
   */
  arch: string;

  /**
   * The type of operating system, including specific operating system
   * names or types (e.g., 'Linux', 'Windows_NT', 'Darwin').
   */
  os_type?: string;

  /**
   * Detailed kernel or system version information.
   * Example: 'Darwin Kernel Version 21.4.0: Fri Mar 18 00:45:05 PDT 2022; root:xnu-8020.101.4~15/RELEASE_X86_64'.
   */
  os_version?: string;

  /**
   * The architecture of the operating system, if available, which might be more specific
   * than the system's processor architecture (e.g., 'x86_64' for 64-bit architecture).
   */
  os_arch?: string;

  /**
   * The release identifier of the operating system.
   * This can provide additional details about the operating system release or
   * version (e.g. the kernel version for a specific macOS release).
   *
   * NOTE: This property helps determine the macOS version in use. The reported
   * version corresponds to the Darwin kernel version, which can be mapped
   * to the respective macOS release using the conversion table available at:
   * https://en.wikipedia.org/wiki/MacOS_version_history.
   */
  os_release?: string;

  /**
   * The Linux distribution name, if running on a Linux-based operating system,
   * derived by reading from `/etc/os-release`.
   * Examples include 'ubuntu', 'debian', or 'rhel'.
   */
  os_linux_dist?: string;

  /**
   * The version of the Linux distribution, if running on a Linux-based operating system,
   * derived by reading from `/etc/os-release`.
   * Examples include '20.04' for Ubuntu or '10' for Debian.
   */
  os_linux_release?: string;
};

export type ConnectionScopedProperties = {
  /**
   * The id of the connection associated to this event.
   */
  connection_id: string | undefined;
};

/**
 * Events that are connection scoped are associated with one connection.
 */
type ConnectionScoped<E extends { payload: unknown }> = E & {
  payload: E['payload'] & ConnectionScopedProperties;
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
 * This event is fired when user failed to sign in to their Atlas account.
 *
 * @category Atlas
 */
type AtlasSignInErrorEvent = {
  name: 'Atlas Sign In Error';
  payload: {
    /**
     * The error message reported on sign in.
     */
    error: string;
  };
};

/**
 * This event is fired when user signed out from their Atlas account.
 *
 * @category Atlas
 */
type AtlasSignOutEvent = {
  name: 'Atlas Sign Out';
  payload: {
    /**
     * The id of the atlas user who signed out.
     */
    auid: string;
  };
};

/**
 * This event is fired when user selects a use case from the aggregation panel.
 *
 * @category Aggregation Builder
 */
type AggregationUseCaseAddedEvent = ConnectionScoped<{
  name: 'Aggregation Use Case Added';
  payload: {
    /**
     * Specifies if the use case was added via drag and drop.
     */
    drag_and_drop?: boolean;
    /**
     * The name of the stage added.
     */
    stage_name?: string;
  };
}>;

/**
 * This event is fired when user adds/remove a stage or changes the stage name
 * in the stage editor view.
 *
 * @category Aggregation Builder
 */
type AggregationEditedEvent = ConnectionScoped<{
  name: 'Aggregation Edited';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages?: number;

    /**
     * The type of view used to edit the aggregation.
     */
    editor_view_type?: 'stage' | 'text' | 'focus';

    /**
     * The index of the stage being edited.
     */
    stage_index?: number;

    /**
     * The edit action being performed for stage and focus mode.
     */
    stage_action?:
      | 'stage_content_changed'
      | 'stage_renamed'
      | 'stage_added'
      | 'stage_deleted'
      | 'stage_reordered'
      | 'stage_added';

    /**
     * The name of the stage edited.
     */
    stage_name?: string | null;
  };
}>;

/**
 * This event is fired when user runs the aggregation.
 *
 * @category Aggregation Builder
 */
type AggregationExecutedEvent = ConnectionScoped<{
  name: 'Aggregation Executed';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;

    /**
     * The type of editor view from which the aggregation has been executed.
     */
    editor_view_type: 'stage' | 'text' | 'focus';

    /**
     * The names of the stages in the pipeline being executed.
     */
    stage_operators: (string | undefined)[];
  };
}>;

/**
 * This event is fired when a user cancel a running aggregation.
 *
 * @category Aggregation Builder
 */
type AggregationCanceledEvent = ConnectionScoped<{
  name: 'Aggregation Canceled';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when an aggregation times out
 *
 * @category Aggregation Builder
 */
type AggregationTimedOutEvent = ConnectionScoped<{
  name: 'Aggregation Timed Out';
  payload: {
    /**
     * The max_time_ms setting of the aggregation timed out.
     */
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
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;
  };
}>;

/**
 * This event is fired when user clicks to expand focus mode.
 *
 * @category Aggregation Builder
 */
type FocusModeOpenedEvent = ConnectionScoped<{
  name: 'Focus Mode Opened';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;
  };
}>;

/**
 * This event is fired when user clicks to minimize focus mode.
 *
 * @category Aggregation Builder
 */
type FocusModeClosedEvent = ConnectionScoped<{
  name: 'Focus Mode Closed';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;

    /**
     * Time elapsed between the focus mode has been opened and then closed
     * (in milliseconds).
     */
    duration: number;
  };
}>;

/**
 * This event is fired when user changes editor type.
 *
 * @category Aggregation Builder
 */
type EditorTypeChangedEvent = ConnectionScoped<{
  name: 'Editor Type Changed';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;

    /**
     * The new type of view that editor was changed to.
     */
    editor_view_type: 'stage' | 'text' | 'focus';
  };
}>;

/**
 * This event is fired when users saves a completed use case form, adding
 * the stage to their pipeline.
 *
 * @category Aggregation Builder
 */
type AggregationUseCaseSavedEvent = ConnectionScoped<{
  name: 'Aggregation Use Case Saved';
  payload: {
    /**
     * The name of the stage the use case refers to.
     */
    stage_name: string | null;
  };
}>;

/**
 * This event is fired when user saves aggregation pipeline.
 *
 * @category Aggregation Builder
 */
type AggregationSavedEvent = ConnectionScoped<{
  name: 'Aggregation Saved';
  payload: {
    /**
     * A unique id for the aggregation object being saved.
     */
    id: string;

    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages?: number;

    /**
     * The type of editor view from which the aggregation is being saved.
     */
    editor_view_type: 'stage' | 'text' | 'focus';
  };
}>;

/**
 * This event is fired when user opens a previously saved aggregation pipeline.
 *
 * @category Aggregation Builder
 */
type AggregationOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Opened';
  payload: {
    /**
     * A unique id for the aggregation object being opened.
     */
    id?: string;

    /**
     * The type of editor view from which the aggregation is being opened.
     */
    editor_view_type?: 'stage' | 'text' | 'focus';

    /**
     * The screen from which the aggregation is being opened.
     */
    screen?: 'my_queries' | 'aggregations';
  };
}>;

/**
 * This event is fired when user deletes a previously saved aggregation pipeline.
 *
 * @category Aggregation Builder
 */
type AggregationDeletedEvent = ConnectionScoped<{
  name: 'Aggregation Deleted';
  payload: {
    /**
     * A unique id for the aggregation object being deleted.
     */
    id?: string;

    /**
     * The type of editor view from which the aggregation has been deleted.
     */
    editor_view_type?: 'stage' | 'text' | 'focus';

    /**
     * The screen from which the aggregation has been deleted.
     */
    screen?: 'my_queries' | 'aggregations';
  };
}>;

/**
 * This event is fired when user clicks the aggregation side panel button.
 *
 * @category Aggregation Builder
 */
type AggregationSidePanelOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Side Panel Opened';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;
  };
}>;

/**
 * This event is fired when user updates a collection view they had opened in the agg
 * builder.
 *
 * @category Aggregation Builder
 */
type ViewUpdatedEvent = ConnectionScoped<{
  name: 'View Updated';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;

    /**
     * The type of editor view from which the view has been updated.
     */
    editor_view_type: 'stage' | 'text' | 'focus';
  };
}>;

/**
 * This event is fired when user runs the explain plan for an aggregation.
 *
 * @category Aggregation Builder
 */
type AggregationExplainedEvent = ConnectionScoped<{
  name: 'Aggregation Explained';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages: number;

    /**
     * Wether the explain reports that an index was used by the query.
     */
    index_used: boolean;
  };
}>;

/**
 * This event is fired when user opens the export to language dialog.
 *
 * @category Aggregation Builder
 */
type AggregationExportOpenedEvent = ConnectionScoped<{
  name: 'Aggregation Export Opened';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages?: undefined | number;
  };
}>;

/**
 * This event is fired when user copies to clipboard the aggregation to export.
 *
 * @category Aggregation Builder
 */
type AggregationExportedEvent = ConnectionScoped<{
  name: 'Aggregation Exported';
  payload: {
    /**
     * The number of stages present in the aggregation at the moment when
     * the even has been fired.
     */
    num_stages?: undefined | number;

    /**
     * The language to which the query has been exported.
     */
    language?:
      | 'java'
      | 'javascript'
      | 'csharp'
      | 'python'
      | 'ruby'
      | 'go'
      | 'rust'
      | 'php';

    /**
     * Indicates that the query was exported including import statements.
     */
    with_import_statements?: boolean;

    /**
     * Indicates that the query was exported including driver syntax.
     */
    with_drivers_syntax?: boolean;

    /**
     * Indicates that the query was exported using builder syntax.
     */
    with_builders?: boolean;
  };
}>;

/**
 * This event is fired when user copied the pipeline to clipboard.
 *
 * @category Aggregation Builder
 */
type AggregationCopiedEvent = {
  name: 'Aggregation Copied';
  payload: {
    /**
     * A unique id for the aggregation object being copied.
     */
    id: string;

    /**
     * The screen from which the aggregation has been copied.
     */
    screen: 'my-queries';
  };
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
 * Note: each forwarded event is exposing a different set of properties in
 * addition to the `mongosh_version` and `session_id`. Refer to the mongosh
 * tracking plan for details about single events.
 *
 * @category Shell
 */
type ShellEvent = ConnectionScoped<{
  name: `Shell ${string}`;
  payload: {
    /**
     * The version of the embedded mongosh package.
     */
    mongosh_version: string;

    /**
     * The shell session_id.
     */
    session_id: string;
  };
}>;

/**
 * This event is fired when an active connection is disconnected.
 *
 * @category Connection
 */
type ConnectionDisconnectedEvent = ConnectionScoped<{
  name: 'Connection Disconnected';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a new connection is saved.
 *
 * @category Connection
 */
type ConnectionCreatedEvent = ConnectionScoped<{
  name: 'Connection Created';
  payload: {
    /**
     * The favorite color for the connection created.
     */
    color?: string;
  };
}>;

/**
 * This event is fired when a connection is removed.
 *
 * @category Connection
 */
type ConnectionRemovedEvent = ConnectionScoped<{
  name: 'Connection Removed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when users attempts to connect to a server/cluster.
 *
 * @category Connection
 */
type ConnectionAttemptEvent = ConnectionScoped<{
  name: 'Connection Attempt';
  payload: {
    /**
     * Specifies if the connection is a favorite.
     */
    is_favorite: boolean;
    /**
     * Specifies if the connection is a newly created connection.
     */
    is_new: boolean;
  };
}>;

export type ExtraConnectionData = {
  /**
   * Desktop only. The authentication type used in the connection.
   */
  auth_type?: string;

  /**
   * Desktop only. The type of tunneling used in the connection.
   */
  tunnel?: string;

  /**
   * Desktop only. Specifies if SRV is used in the connection.
   */
  is_srv?: boolean;

  /**
   * Desktop only. Specifies if the connection is targeting localhost.
   */
  is_localhost?: boolean;

  /**
   * Desktop only. Specifies if the connection URL is an Atlas URL.
   */
  is_atlas_url?: boolean;

  /**
   * Desktop only. Specifies if the connection URL is a DigitalOcean URL.
   */
  is_do_url?: boolean;

  /**
   * Desktop only. Specifies if the connection is in a public cloud.
   */
  is_public_cloud?: boolean;

  /**
   * The name of the public cloud provider, if applicable.
   */
  public_cloud_name?: string;

  /**
   * Specifies if Client-Side Field Level Encryption (CSFLE) is used.
   */
  is_csfle?: boolean;

  /**
   * Specifies if CSFLE schema is present.
   */
  has_csfle_schema?: boolean;

  /**
   * Specifies the number of AWS KMS providers used.
   */
  count_kms_aws?: number;

  /**
   * Specifies the number of GCP KMS providers used.
   */
  count_kms_gcp?: number;

  /**
   * Specifies the number of KMIP KMS providers used.
   */
  count_kms_kmip?: number;

  /**
   * Specifies the number of Local KMS providers used.
   */
  count_kms_local?: number;

  /**
   * Specifies the number of Azure KMS providers used.
   */
  count_kms_azure?: number;
};

/**
 * This event is fired when user successfully connects to a new server/cluster.
 *
 * @category Connection
 */
type NewConnectionEvent = ConnectionScoped<{
  name: 'New Connection';
  payload: {
    /**
     * Specifies if the connection is targeting an Atlas cluster.
     */
    is_atlas: boolean;

    /**
     * The first resolved SRV hostname in case the connection is targeting an Atlas cluster.
     */
    atlas_hostname: string | null;

    /**
     * Specifies that the connection is targeting an Atlas local deployment.
     */
    is_local_atlas: boolean;

    /**
     * Specifies that the connection is targeting an Atlas Data Federation deployment.
     */
    is_dataLake: boolean;

    /**
     * Specifies that the connection is targeting an Atlas Enterprise deployment.
     */
    is_enterprise: boolean;

    /**
     * Specifies if the connection is targeting a genuine MongoDB deployment.
     */
    is_genuine: boolean;

    /**
     * The advertised server name, in case of non-genuine deployment.
     */
    non_genuine_server_name: string;

    /**
     * The version of the connected server.
     */
    server_version: string;

    /**
     * The host architecture of the connected server.
     */
    server_arch?: string;

    /**
     * The OS family of the connected server.
     */
    server_os_family?: string;

    /**
     * The type of connected topology.
     */
    topology_type: string;

    /**
     * The number of active connections.
     */
    num_active_connections: number;

    /**
     * The number of inactive connections.
     */
    num_inactive_connections: number;
  } & ExtraConnectionData;
}>;

/**
 * This event is fired when a connection attempt fails.
 *
 * @category Connection
 */
type ConnectionFailedEvent = ConnectionScoped<{
  name: 'Connection Failed';
  payload: {
    /**
     * The error code (if available).
     */
    error_code: string | number | undefined;

    /**
     * The error name.
     */
    error_name: string;
  } & ExtraConnectionData;
}>;

/**
 * This event is fired when connections export initiated from either UI or CLI.
 *
 * @category Connection
 */
type ConnectionExportedEvent = {
  name: 'Connection Exported';
  payload: {
    /**
     * Number of connections exported.
     */
    count: number;
  };
};

/**
 * This event is fired when connections import initiated from either UI or CLI.
 *
 * @category Connection
 */
type ConnectionImportedEvent = {
  name: 'Connection Imported';
  payload: {
    /**
     * Number of connections imported.
     */
    count: number;
  };
};

/**
 * This event is fired when user copies a document to the clipboard.
 *
 * @category Documents
 */
type DocumentCopiedEvent = ConnectionScoped<{
  name: 'Document Copied';
  payload: {
    /**
     * The view used to copy the document.
     */
    mode: 'list' | 'json' | 'table';
  };
}>;

/**
 * This event is fired when user deletes a document.
 *
 * @category Documents
 */
type DocumentDeletedEvent = ConnectionScoped<{
  name: 'Document Deleted';
  payload: {
    /**
     * The view used to delete the document.
     */
    mode: 'list' | 'json' | 'table';
  };
}>;

/**
 * This event is fired when user updates a document
 *
 * @category Documents
 */
type DocumentUpdatedEvent = ConnectionScoped<{
  name: 'Document Updated';
  payload: {
    /**
     * The view used to delete the document.
     */
    mode: 'list' | 'json' | 'table';
  };
}>;

/**
 * This event is fired when user clones a document.
 *
 * @category Documents
 */
type DocumentClonedEvent = ConnectionScoped<{
  name: 'Document Cloned';
  payload: {
    /**
     * The view used to clone the document.
     */
    mode: 'list' | 'json' | 'table';
  };
}>;

/**
 * This event is fired when user inserts documents.
 *
 * @category Documents
 */
type DocumentInsertedEvent = ConnectionScoped<{
  name: 'Document Inserted';
  payload: {
    /**
     * The view used to insert documents.
     */
    mode?: string;

    /**
     * Specifies if the user inserted multiple documents.
     */
    multiple?: boolean;
  };
}>;

/**
 * This event is fired when user explains a query.
 *
 * @category Explain
 */
type ExplainPlanExecutedEvent = ConnectionScoped<{
  name: 'Explain Plan Executed';
  payload: {
    /**
     * Specifies if a filter was set.
     */
    with_filter: boolean;

    /**
     * Specifies if the explain reports that an index was used by the query.
     */
    index_used: boolean;
  };
}>;

/**
 * This event is fired when a user opens the bulk update modal.
 *
 * @category Bulk Operations
 */
type BulkUpdateOpenedEvent = ConnectionScoped<{
  name: 'Bulk Update Opened';
  payload: {
    /**
     * Specifies if update preview was supported (the update preview runs inside a transaction.)
     */
    isUpdatePreviewSupported: boolean;
  };
}>;

/**
 * This event is fired when a user runs a bulk update operation.
 *
 * @category Bulk Operations
 */
type BulkUpdateExecutedEvent = ConnectionScoped<{
  name: 'Bulk Update Executed';
  payload: {
    /**
     * Specifies if update preview was supported (the update preview runs inside a transaction.)
     */
    isUpdatePreviewSupported: boolean;
  };
}>;

/**
 * This event is fired when a user opens the bulk delete modal.
 *
 * @category Bulk Operations
 */
type BulkDeleteOpenedEvent = ConnectionScoped<{
  name: 'Bulk Delete Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user runs a bulk delete operation.
 *
 * @category Bulk Operations
 */
type BulkDeleteExecutedEvent = ConnectionScoped<{
  name: 'Bulk Delete Executed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user runs a bulk update operation is added to
 * favorites.
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
  payload: Record<string, never>;
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
  payload: Record<string, never>;
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
 * This event is fired when user opens the export dialog.
 *
 * @category Import/Export
 */
type ExportOpenedEvent = ConnectionScoped<{
  name: 'Export Opened';
  payload: {
    /**
     * The type of query for which the export has been open. (query = find query).
     */
    type: 'aggregation' | 'query';

    /**
     * The trigger location for the export.
     */
    origin: 'menu' | 'crud-toolbar' | 'empty-state' | 'aggregations-toolbar';
  };
}>;

/**
 * This event is fired when a data export completes.
 *
 * @category Import/Export
 */
type ExportCompletedEvent = ConnectionScoped<{
  name: 'Export Completed';
  payload: {
    /**
     * The type of query for the completed export. (query = find query).
     */
    type: 'aggregation' | 'query';

    /**
     * Indicates whether the export was for all documents in the collection.
     */
    all_docs?: boolean;

    /**
     * Indicates whether the export query included a projection (a subset of fields).
     */
    has_projection?: boolean;

    /**
     * Specifies whether all fields were exported or only selected fields.
     */
    field_option?: 'all-fields' | 'select-fields';

    /**
     * The file type of the exported data, either CSV or JSON.
     */
    file_type: 'csv' | 'json';

    /**
     * Specifies the format of the JSON file if the file_type is 'json'.
     */
    json_format?: 'default' | 'relaxed' | 'canonical';

    /**
     * For exports with field selection, this is the number of fields that were present
     * in the list of available fields and that were selected for export.
     */
    field_count?: number;

    /**
     * For exports with field selection, this is the number of fields that has been added
     * manually by the user.
     */
    fields_added_count?: number;

    /**
     * For exports with field selection, this is the number of fields that were present
     * in the list of available fields, but that were not selected for export.
     */
    fields_not_selected_count?: number;

    /**
     * The total number of documents exported.
     */
    number_of_docs?: number;

    /**
     * Indicates whether the export operation was successful.
     */
    success: boolean;

    /**
     * Indicates whether the export operation was stopped before completion.
     */
    stopped: boolean;

    /**
     * The duration of the export operation in milliseconds.
     */
    duration: number;
  };
}>;

/**
 * This event is fired when a data import completes.
 *
 * @category Import/Export
 */
type ImportCompletedEvent = ConnectionScoped<{
  name: 'Import Completed';
  payload: {
    /**
     * The duration of the import operation in milliseconds.
     */
    duration?: number;

    /**
     * The delimiter used in the imported file. It could be a comma, tab,
     * semicolon, or space.
     * This field is optional and only applicable if the file_type is 'csv'.
     */
    delimiter?: ',' | '\t' | ';' | ' ';

    /**
     * The newline character(s) used in the imported file.
     */
    newline?: '\r\n' | '\n';

    /**
     * The type of the imported file, such as CSV or JSON.
     */
    file_type?: '' | 'csv' | 'json';

    /**
     * Indicates whether all fields in the documents were included in the import.
     * If true, all fields in each document were imported; if false, only
     * selected fields were imported.
     */
    all_fields?: boolean;

    /**
     * Indicates whether the "Stop on Error" option was selected during the import.
     * If true, the import process stops upon encountering an error.
     */
    stop_on_error_selected?: boolean;

    /**
     * The total number of documents imported.
     */
    number_of_docs?: number;

    /**
     * Indicates whether the import operation was successful.
     */
    success?: boolean;

    /**
     * Indicates whether the import operation was aborted before completion.
     */
    aborted?: boolean;

    /**
     * Indicates whether empty strings in the imported file were ignored.
     * If true, fields with empty strings were not included in the imported documents.
     */
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
  payload: {
    /**
     * Number of import errors present in the log.
     */
    errorCount: number;
  };
}>;

/**
 * This event is fired when user opens the import dialog.
 *
 * @category Import/Export
 */
type ImportOpenedEvent = ConnectionScoped<{
  name: 'Import Opened';
  payload: {
    /**
     * The trigger location for the import.
     */
    origin: 'menu' | 'crud-toolbar' | 'empty-state';
  };
}>;

/**
 * This event is fired when user opens create index dialog.
 *
 * @category Indexes
 */
type IndexCreateOpenedEvent = ConnectionScoped<{
  name: 'Index Create Opened';
  payload: {
    /**
     * Specifies if the index creation dialog open is for an Atlas Search index.
     */
    atlas_search?: boolean;
  };
}>;

/**
 * This event is fired when user creates an index.
 *
 * @category Indexes
 */
type IndexCreatedEvent = ConnectionScoped<{
  name: 'Index Created';

  payload: {
    /**
     * Indicates whether the index is unique.
     */
    unique?: boolean;

    /**
     * Specifies the time-to-live (TTL) setting for the index.
     */
    ttl?: any;

    /**
     * Indicates whether the index is a columnstore index.
     */
    columnstore_index?: boolean;

    /**
     * Indicates if the index has a columnstore projection.
     */
    has_columnstore_projection?: any;

    /**
     * Indicates if the index includes a wildcard projection.
     */
    has_wildcard_projection?: any;

    /**
     * Specifies if the index uses a custom collation.
     */
    custom_collation?: any;

    /**
     * Indicates whether the index is a geospatial index.
     */
    geo?: boolean;

    /**
     * Indicates whether the index is an Atlas Search index.
     */
    atlas_search?: boolean;

    /**
     * Specifies the type of the index.
     */
    type?: string;
  };
}>;

/**
 * This event is fired when user creates an index and it fails.
 *
 * @category Indexes
 */
type IndexCreateFailedEvent = ConnectionScoped<{
  name: 'Index Create Failed';

  payload: {
    /**
     * Indicates whether the index is unique.
     */
    unique?: boolean;

    /**
     * Specifies the time-to-live (TTL) setting for the index.
     */
    ttl?: any;

    /**
     * Indicates whether the index is a columnstore index.
     */
    columnstore_index?: boolean;

    /**
     * Indicates if the index has a columnstore projection.
     */
    has_columnstore_projection?: any;

    /**
     * Indicates if the index includes a wildcard projection.
     */
    has_wildcard_projection?: any;

    /**
     * Specifies if the index uses a custom collation.
     */
    custom_collation?: any;

    /**
     * Indicates whether the index is a geospatial index.
     */
    geo?: boolean;

    /**
     * Indicates whether the index is an Atlas Search index.
     */
    atlas_search?: boolean;

    /**
     * Specifies the type of the index.
     */
    type?: string;
  };
}>;

/**
 * This event is fired when user updates an index.
 *
 * @category Indexes
 */
type IndexEditedEvent = ConnectionScoped<{
  name: 'Index Edited';
  payload: {
    /**
     * Indicates whether the index is an Atlas Search index.
     */
    atlas_search: boolean;
  };
}>;

/**
 * This event is fired when user drops an index.
 *
 * @category Indexes
 */
type IndexDroppedEvent = ConnectionScoped<{
  name: 'Index Dropped';
  payload: {
    /**
     * Indicates whether the index is an Atlas Search index.
     */
    atlas_search?: boolean;
  };
}>;

/**
 * This event is fired when a user submits feedback for a query generation.
 *
 * @category Gen AI
 */
type AiQueryFeedbackEvent = ConnectionScoped<{
  name: 'AI Query Feedback';
  payload: {
    feedback: 'positive' | 'negative';
    text: string;
    request_id: string | null;
  };
}>;

/**
 * This event is fired when a query generation request fails with an error.
 *
 * @category Gen AI
 */
type AiResponseFailedEvent = ConnectionScoped<{
  name: 'AI Response Failed';
  payload: {
    /**
     * The type of view used to generate the query.
     */
    editor_view_type: 'text' | 'stages' | 'find';
    error_code?: string;
    status_code?: number;
    error_name?: string;
    request_id?: string;
  };
}>;

/**
 * This event is fired when user enters a prompt in the generative AI textbox
 * and hits "enter".
 *
 * @category Gen AI
 */
type AiPromptSubmittedEvent = ConnectionScoped<{
  name: 'AI Prompt Submitted';
  payload: {
    /**
     * The type of view used to generate the query.
     */
    editor_view_type: 'text' | 'stages' | 'find';
    user_input_length?: number;
    request_id?: string;
    has_sample_documents?: boolean;
  };
}>;

/**
 * This event is fired when AI query or aggregation generated and successfully
 * rendered in the UI.
 *
 * @category Gen AI
 */
type AiResponseGeneratedEvent = ConnectionScoped<{
  name: 'AI Response Generated';
  payload: {
    /**
     * The type of view used to generate the query.
     */
    editor_view_type: 'text' | 'stages' | 'find';
    syntax_errors?: boolean;
    query_shape?: (string | null)[];
    request_id?: string;
  };
}>;

/**
 * This event is fired when a user submits feedback for a pipeline generation.
 *
 * @category Gen AI
 */
type PipelineAiFeedbackEvent = ConnectionScoped<{
  name: 'PipelineAI Feedback';
  payload: {
    /**
     * Wether the feedback was positive or negative.
     */
    feedback: 'positive' | 'negative';

    /**
     * The id of the request related to this feedback. Useful to correlate
     * feedback to potential error lines in the logs.
     */
    request_id: string | null;

    /**
     * The feedback comment left by the user.
     */
    text: string;
  };
}>;

/**
 * This event is fired when user filters queries using db / coll filter.
 *
 * @category My Queries
 */
type MyQueriesFilterEvent = {
  name: 'My Queries Filter';
  payload: {
    /**
     * The filter that was changed.
     */
    type?: 'database' | 'collection';
  };
};

/**
 * This event is fired when user sorts items in the list using one of the
 * sort options.
 *
 * @category My Queries
 */
type MyQueriesSortEvent = {
  name: 'My Queries Sort';
  payload: {
    /**
     * The criterion by which the queries are sorted.
     */
    sort_by:
      | 'name'
      | 'id'
      | 'type'
      | 'database'
      | 'collection'
      | 'lastModified'
      | null;

    /**
     * The order of the sorting.
     */
    order: 'ascending' | 'descending';
  };
};

/**
 * This event is fired when user filters queries using search
 * input (fires only on input blur).
 *
 * @category My Queries
 */
type MyQueriesSearchEvent = {
  name: 'My Queries Search';
  payload: Record<string, never>;
};

/**
 * This event is fired when user copies to clipboard the query to export.
 *
 * @category Find Queries
 */
type QueryExportedEvent = ConnectionScoped<{
  name: 'Query Exported';
  payload: {
    /**
     * The language to which the query has been exported.
     */
    language?:
      | 'java'
      | 'javascript'
      | 'csharp'
      | 'python'
      | 'ruby'
      | 'go'
      | 'rust'
      | 'php';

    /**
     * Indicates that the query was exported including import statements.
     */
    with_import_statements?: boolean;

    /**
     * Indicates that the query was exported including driver syntax.
     */
    with_drivers_syntax?: boolean;

    /**
     * Indicates that the query was exported using builder syntax.
     */
    with_builders?: boolean;
  };
}>;

/**
 * This event is fired when user opens the export to language dialog.
 *
 * @category Find Queries
 */
type QueryExportOpenedEvent = ConnectionScoped<{
  name: 'Query Export Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user executes a query
 *
 * @category Find Queries
 */
type QueryExecutedEvent = ConnectionScoped<{
  name: 'Query Executed';
  payload: {
    /**
     * Indicates whether the query includes a projection.
     */
    has_projection: boolean;

    /**
     * Indicates whether the query includes a skip operation.
     */
    has_skip: boolean;

    /**
     * Indicates whether the query includes a sort operation.
     */
    has_sort: boolean;

    /**
     * Indicates whether the query includes a limit operation.
     */
    has_limit: boolean;

    /**
     * Indicates whether the query includes a collation.
     */
    has_collation: boolean;

    /**
     * Indicates whether the maxTimeMS option was modified for the query.
     */
    changed_maxtimems: boolean;

    /**
     * The type of the collection on which the query was executed.
     */
    collection_type: string;

    /**
     * Indicates whether the query used a regular expression.
     */
    used_regex: boolean;
  };
}>;

/**
 * This event is fired when user clicks the refresh button in the UI to refresh
 * the query results.
 *
 * @category Find Queries
 */
type QueryResultsRefreshedEvent = ConnectionScoped<{
  name: 'Query Results Refreshed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user opens query history panel.
 *
 * @category Find Queries
 */
type QueryHistoryOpenedEvent = ConnectionScoped<{
  name: 'Query History Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user closes query history panel
 *
 * @category Find Queries
 */
type QueryHistoryClosedEvent = ConnectionScoped<{
  name: 'Query History Closed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user selects a favorite query to put it in the query bar.
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteUsedEvent = ConnectionScoped<{
  name: 'Query History Favorite Used';
  payload: {
    /**
     * The unique identifier of the query history favorite that was used.
     */
    id?: string;

    /**
     * The screen from which the query history favorite was loaded.
     */
    screen?: 'documents' | 'my-queries';

    /**
     * Indicates whether the loaded query was an update query.
     */
    isUpdateQuery?: boolean;
  };
}>;

/**
 * This event is fired when user removes query from favorites.
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteRemovedEvent = ConnectionScoped<{
  name: 'Query History Favorite Removed';
  payload: {
    /**
     * The unique identifier of the query history favorite that was removed.
     */
    id?: string;

    /**
     * The screen from which the query history favorite was removed.
     */
    screen?: 'documents' | 'my-queries';

    /**
     * Indicates whether the removed query was an update query.
     */
    isUpdateQuery?: boolean;
  };
}>;

/**
 * This event is fired when user selects "favorites" in query history panel.
 *
 * @category Find Queries
 */
type QueryHistoryFavoritesEvent = ConnectionScoped<{
  name: 'Query History Favorites';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user selects "recent" in query history panel.
 *
 * @category Find Queries
 */
type QueryHistoryRecentEvent = ConnectionScoped<{
  name: 'Query History Recent';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user selects a recent query to put it in the query bar.
 *
 * @category Find Queries
 */
type QueryHistoryRecentUsedEvent = ConnectionScoped<{
  name: 'Query History Recent Used';
  payload: { isUpdateQuery: boolean };
}>;

/**
 * This event is fired when user favorites a recent query.
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteAddedEvent = ConnectionScoped<{
  name: 'Query History Favorite Added';
  payload: {
    /**
     * Indicates whether the query was an update query.
     */
    isUpdateQuery: boolean;
  };
}>;

/**
 * This event is fired when a user edits a query.
 *
 * @category Find Queries
 */
type QueryEditedEvent = ConnectionScoped<{
  name: 'Query Edited';
  payload: {
    /**
     * The name of the edited field.
     */
    option_name:
      | 'maxTimeMS'
      | 'filter'
      | 'project'
      | 'collation'
      | 'sort'
      | 'skip'
      | 'limit'
      | 'hint';
  };
}>;

/**
 * This event is fired when user copied query to clipboard.
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteCopiedEvent = {
  name: 'Query History Favorite Copied';
  payload: {
    /**
     * The unique identifier of the query history favorite that was copied.
     */
    id: string;

    /**
     * The screen from which the query history favorite was copied.
     */
    screen: 'my_queries';
  };
};

/**
 * This event is fired when user edits validation rules (without saving them).
 *
 * @category Schema Validation
 */
type SchemaValidationEditedEvent = ConnectionScoped<{
  name: 'Schema Validation Edited';
  payload: {
    /**
     * Indicates wether the validation rule uses $jsonSchema.
     */
    json_schema: boolean;
  };
}>;

/**
 * This event is fired when user saves validation rules.
 *
 * @category Schema Validation
 */
type SchemaValidationUpdatedEvent = ConnectionScoped<{
  name: 'Schema Validation Updated';
  payload: {
    /**
     * The validation action passed to the driver.
     */
    validation_action: 'error' | 'warn';

    /**
     * The level of schema validation passed to the driver.
     */
    validation_level: 'off' | 'moderate' | 'strict';
  };
}>;

/**
 * This event is fired when user adds validation rules.
 *
 * @category Schema Validation
 */
type SchemaValidationAddedEvent = ConnectionScoped<{
  name: 'Schema Validation Added';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user analyzes the schema.
 *
 * @category Schema
 */
type SchemaAnalyzedEvent = ConnectionScoped<{
  name: 'Schema Analyzed';
  payload: {
    /**
     * Indicates whether a filter was applied during the schema analysis.
     */
    with_filter: boolean;

    /**
     * The number of fields at the top level.
     */
    schema_width: number;

    /**
     * The number of nested levels.
     */
    schema_depth: number;

    /**
     * Indicates whether the schema contains geospatial data.
     */
    geo_data: boolean;

    /**
     * The time taken to analyze the schema, in milliseconds.
     */
    analysis_time_ms: number;
  };
}>;

/**
 * This event is fired when user shares the schema.
 *
 * @category Schema
 */
type SchemaExportedEvent = ConnectionScoped<{
  name: 'Schema Exported';
  payload: {
    /**
     * Indicates whether the schema was analyzed before sharing.
     */
    has_schema: boolean;

    /**
     * The number of fields at the top level.
     */
    schema_width: number;

    /**
     * The number of nested levels.
     */
    schema_depth: number;

    /**
     * Indicates whether the schema contains geospatial data.
     */
    geo_data: boolean;
  };
}>;

/**
 * This event is fired when a user clicks to show the details of an operation.
 *
 * @category Performance Tab
 */
type CurrentOpShowOperationDetailsEvent = ConnectionScoped<{
  name: 'CurrentOp showOperationDetails';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks to hide the details of an operation.
 *
 * @category Performance Tab
 */
type DetailViewHideOperationDetailsEvent = ConnectionScoped<{
  name: 'DetailView hideOperationDetails';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks to kill an operation.
 *
 * @category Performance Tab
 */
type DetailViewKillOpEvent = ConnectionScoped<{
  name: 'DetailView killOp';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user resumes a paused performance screen.
 *
 * @category Performance Tab
 */
type PerformanceResumedEvent = ConnectionScoped<{
  name: 'Performance Resumed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user pauses the performance screen.
 *
 * @category Performance Tab
 */
type PerformancePausedEvent = ConnectionScoped<{
  name: 'Performance Paused';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks "next" on a guide cue.
 *
 * @category Guide Cues
 */
type GuideCueDismissedEvent = {
  name: 'Guide Cue Dismissed';
  payload: {
    /**
     * The unique identifier of the group of guide cues to which this cue belongs.
     * This field is only set for guide cues belonging to a group.
     */
    groupId?: string;

    /**
     * The unique identifier of the specific guide cue that was dismissed.
     */
    cueId: string;

    /**
     * The step number within the guide cue sequence where the user clicked "next".
     */
    step: number;
  };
};

/**
 * This event is fired when a user clicks "next" on the last guide cue of a
 * guide cue group.
 *
 * @category Guide Cues
 */
type GuideCueGroupDismissedEvent = {
  name: 'Guide Cue Group Dismissed';
  payload: {
    /**
     * The unique identifier of the group of guide cues that was dismissed.
     */
    groupId: string;

    /**
     * The unique identifier of the specific guide cue that was the last one in the group.
     */
    cueId: string;

    /**
     * The step number within the guide cue sequence where the user clicked "next".
     */
    step: number;
  };
};

/**
 * This event is fired when signal icon badge is rendered on the screen visible to the user.
 *
 * @category Proactive Performance Insights
 */
type SignalShownEvent = {
  name: 'Signal Shown';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
};

/**
 * This event is fired when signal badge is clicked and popup is opened.
 *
 * @category Proactive Performance Insights
 */
type SignalOpenedEvent = {
  name: 'Signal Opened';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
};

/**
 * This event is fired when Action button for the signal is clicked inside the popup.
 *
 * @category Proactive Performance Insights
 */
type SignalActionButtonClickedEvent = {
  name: 'Signal Action Button Clicked';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
};

/**
 * This event is fired when "Learn more" link is clicked inside the signal popup.
 *
 * @category Proactive Performance Insights
 */
type SignalLinkClickedEvent = {
  name: 'Signal Link Clicked';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
};

/**
 * This event is fired when user clicked the close button or outside the signal and closed the popup.
 *
 * @category Proactive Performance Insights
 */
type SignalClosedEvent = {
  name: 'Signal Closed';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
};
/**
 * This event is fired when the "Update available" popup is shown and the user accepts the update.
 *
 * @category Auto-updates
 */
type AutoupdateAcceptedEvent = {
  name: 'Autoupdate Accepted';
  payload: {
    /**
     * The version of the update that was accepted.
     */
    update_version?: string;

    /**
     * Indicates whether the update was initiated manually by the user.
     */
    manual_update?: boolean;

    /**
     * Indicates whether the update was downloaded manually by the user.
     */
    manual_download?: boolean;
  };
};

/**
 * This event is fired when the user accepts to restart the application from the update popup.
 *
 * @category Auto-updates
 */
type ApplicationRestartAcceptedEvent = {
  name: 'Application Restart Accepted';
  payload: Record<string, never>;
};

/**
 * This event is fired when the auto-update feature is enabled.
 *
 * @category Auto-updates
 */
type AutoupdateEnabledEvent = {
  name: 'Autoupdate Enabled';
  payload: Record<string, never>;
};

/**
 * This event is fired when the auto-update feature is disabled.
 *
 * @category Auto-updates
 */
type AutoupdateDisabledEvent = {
  name: 'Autoupdate Disabled';
  payload: Record<string, never>;
};

/**
 * This event is fired when the "Update available" popup is shown and the user rejects the update.
 *
 * @category Auto-updates
 */
type AutoupdateDismissedEvent = {
  name: 'Autoupdate Dismissed';
  payload: {
    /**
     * The version of the update that was dismissed.
     */
    update_version: string;
  };
};

/**
 * This event is fired when the user changes the items view type between list and grid.
 *
 * @category Database / Collection List
 */
type SwitchViewTypeEvent = ConnectionScoped<{
  name: 'Switch View Type';
  payload: {
    /**
     * The type of view that the user switched to.
     */
    view_type: 'grid' | 'list';

    /**
     * The type of item being viewed, either 'collection' or 'database'.
     */
    item_type: 'collection' | 'database';
  };
}>;

/**
 * This event is fired when a collection is created.
 *
 * @category Database / Collection List
 */
type CollectionCreatedEvent = ConnectionScoped<{
  name: 'Collection Created';
  payload: {
    /**
     * Indicates whether the collection is capped.
     */
    is_capped: boolean;

    /**
     * Indicates whether the collection has a custom collation.
     */
    has_collation: boolean;

    /**
     * Indicates whether the collection is a time series collection.
     */
    is_timeseries: boolean;

    /**
     * Indicates whether the collection is clustered.
     */
    is_clustered: boolean;

    /**
     * Indicates whether the collection is encrypted using FLE2 (Field-Level Encryption 2).
     */
    is_fle2: boolean;

    /**
     * Indicates whether the collection has an expiration (TTL index).
     */
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
    /**
     * Indicates whether the first collection in the database is capped.
     */
    is_capped: boolean;

    /**
     * Indicates whether the first collection in the database has a custom collation.
     */
    has_collation: boolean;

    /**
     * Indicates whether the first collection in the database is a time series collection.
     */
    is_timeseries: boolean;

    /**
     * Indicates whether the first collection in the database is clustered.
     */
    is_clustered: boolean;

    /**
     * Indicates whether the first collection in the database is encrypted using FLE2 (Field-Level Encryption 2).
     */
    is_fle2: boolean;

    /**
     * Indicates whether the first collection in the database has an expiration (TTL index).
     */
    expires: boolean;
  };
}>;

/**
 * This event is fired when a user changes the theme.
 *
 * @category Settings
 */
type ThemeChangedEvent = {
  name: 'Theme Changed';
  payload: {
    /**
     * The theme selected by the user. It can be 'DARK', 'LIGHT', or 'OS_THEME'.
     */
    theme: 'DARK' | 'LIGHT' | 'OS_THEME';
  };
};

/**
 * This event is fired at startup to report the First Contentful Paint metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type FirstContentfulPaintEvent = {
  name: 'First Contentful Paint';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
};

/**
 * This event is fired at startup to report the Largest Contentful Paint metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type LargestContentfulPaintEvent = {
  name: 'Largest Contentful Paint';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
};

/**
 * This event is fired at startup to report the First Input Delay metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type FirstInputDelayEvent = {
  name: 'First Input Delay';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
};

/**
 * This event is fired at startup to report the Cumulative Layout Shift metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type CumulativeLayoutShiftEvent = {
  name: 'Cumulative Layout Shift';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
};

/**
 * This event is fired at startup to report the Time to First Byte metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type TimeToFirstByteEvent = {
  name: 'Time to First Byte';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
};
/**
 * This event is fired when a user clicks on the Atlas CTA.
 *
 * @category Other
 */
type AtlasLinkClickedEvent = {
  name: 'Atlas Link Clicked';
  payload: {
    /**
     * The screen from which the Atlas CTA was clicked.
     */
    screen?: 'agg_builder' | 'connect';
  };
};

/**
 * This event is fired when the application launch is initiated.
 *
 * @category Other
 */
type ApplicationLaunchedEvent = {
  name: 'Application Launched';
  payload: {
    /**
     * The context from which the application was launched.
     * (NOT whether it is used as a CLI-only tool or not)
     */
    context: 'terminal' | 'desktop_app';

    /**
     * Whether Compass was instructed to automatically connect
     * to a specific cluster using a connection string on the command line,
     * a JSON file containing an exported connection on the command line,
     * or not at all.
     */
    launch_connection: 'string' | 'JSON_file' | 'none';

    /**
     * Whether the `protectConnectionStrings` preference was set at launch.
     */
    protected?: boolean;

    /**
     * Whether the `readOnly` preference was set at launch (including the
     * compass-readonly distribution).
     */
    readOnly: boolean;

    /**
     * The value of the `maxTimeMS` preference at launch.
     */
    maxTimeMS?: number;

    /**
     * Whether any preferences were specified in the global configuration file.
     */
    global_config: boolean;

    /**
     * Whether any preferences were specified using CLI arguments.
     */
    cli_args: boolean;

    /**
     * Whether Compass discovered any connections in the legacy connection format
     * (prior to COMPASS-5490 'Remove storage-mixin' from summer 2023).
     */
    legacy_connections: boolean;
  };
};

/**
 * This event is fired when the keytar migration fails for a user.
 * See: https://jira.mongodb.org/browse/COMPASS-6856.
 *
 * NOTE: Should be removed as part of https://jira.mongodb.org/browse/COMPASS-7948.
 *
 * @category Other
 */
type KeytarSecretsMigrationFailedEvent = {
  name: 'Keytar Secrets Migration Failed';
  payload: {
    /**
     * The number of connections that were successfully saved.
     */
    num_saved_connections: number;

    /**
     * The number of connections that failed to save during the migration.
     */
    num_failed_connections: number;
  };
};

/**
 * This event is fired when we fail to track another event due to an exception
 * while building the attributes.
 *
 * @category Other
 */
type ErrorFetchingAttributesEvent = {
  name: 'Error Fetching Attributes';
  payload: {
    /**
     * The name of the event for which attributes could not be fetched.
     */
    event_name: string;
  };
};

/**
 * This event is fired when a user activates (i.e., navigates to) a screen.
 *
 * @category Other
 */
type ScreenEvent = ConnectionScoped<{
  name: 'Screen';
  payload: {
    /**
     * The name of the screen that was activated.
     */
    name?:
      | 'aggregations'
      | 'collections'
      | 'databases'
      | 'documents'
      | 'indexes'
      | 'globalwrites'
      | 'my_queries'
      | 'performance'
      | 'schema'
      | 'validation'
      | 'confirm_new_pipeline_modal'
      | 'create_collection_modal'
      | 'create_database_modal'
      | 'drop_collection_modal'
      | 'drop_database_modal'
      | 'create_index_modal'
      | 'create_search_index_modal'
      | 'create_view_modal'
      | 'csfle_connection_modal'
      | 'delete_pipeline_modal'
      | 'drop_index_modal'
      | 'export_modal'
      | 'export_to_language_modal'
      | 'import_modal'
      | 'insert_document_modal'
      | 'non_genuine_mongodb_modal'
      | 'rename_collection_modal'
      | 'restore_pipeline_modal'
      | 'save_pipeline_modal'
      | 'shell_info_modal'
      | 'update_search_index_modal';
  };
}>;

/**
 * This event is fired when a user clicks on the Performance Advisor CTA.
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
  | IndexCreateFailedEvent
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
  | SchemaExportedEvent
  | SchemaValidationAddedEvent
  | SchemaValidationEditedEvent
  | SchemaValidationUpdatedEvent
  | ScreenEvent
  | ShellEvent
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

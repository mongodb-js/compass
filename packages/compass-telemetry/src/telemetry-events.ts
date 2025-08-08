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

export type CommonProperties = {
  is_compass_web?: true;
};

/**
 * All events in compass
 */
type CommonEvent<E extends { payload: unknown }> = E & {
  payload: E['payload'] & CommonProperties;
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
type ConnectionScopedEvent<E extends { payload: unknown }> = E & {
  payload: E['payload'] & CommonProperties & ConnectionScopedProperties;
};

/**
 * This event is fired when user successfully signed in to their Atlas account
 *
 * @category Atlas
 */
type AtlasSignInSuccessEvent = CommonEvent<{
  name: 'Atlas Sign In Success';
  payload: {
    /**
     * The id of the atlas user who signed in.
     */
    auid: string;
  };
}>;

/**
 * This event is fired when user failed to sign in to their Atlas account.
 *
 * @category Atlas
 */
type AtlasSignInErrorEvent = CommonEvent<{
  name: 'Atlas Sign In Error';
  payload: {
    /**
     * The error message reported on sign in.
     */
    error: string;
  };
}>;

/**
 * This event is fired when user signed out from their Atlas account.
 *
 * @category Atlas
 */
type AtlasSignOutEvent = CommonEvent<{
  name: 'Atlas Sign Out';
  payload: {
    /**
     * The id of the atlas user who signed out.
     */
    auid: string;
  };
}>;

/**
 * This event is fired when user selects a use case from the aggregation panel.
 *
 * @category Aggregation Builder
 */
type AggregationUseCaseAddedEvent = ConnectionScopedEvent<{
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
type AggregationEditedEvent = ConnectionScopedEvent<{
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
      | 'stage_reordered';

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
type AggregationExecutedEvent = ConnectionScopedEvent<{
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
type AggregationCanceledEvent = ConnectionScopedEvent<{
  name: 'Aggregation Canceled';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when an aggregation times out
 *
 * @category Aggregation Builder
 */
type AggregationTimedOutEvent = ConnectionScopedEvent<{
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
type AggregationSavedAsViewEvent = ConnectionScopedEvent<{
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
type FocusModeOpenedEvent = ConnectionScopedEvent<{
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
type FocusModeClosedEvent = ConnectionScopedEvent<{
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
type EditorTypeChangedEvent = ConnectionScopedEvent<{
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
type AggregationUseCaseSavedEvent = ConnectionScopedEvent<{
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
type AggregationSavedEvent = ConnectionScopedEvent<{
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
type AggregationOpenedEvent = ConnectionScopedEvent<{
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
type AggregationDeletedEvent = ConnectionScopedEvent<{
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
type AggregationSidePanelOpenedEvent = ConnectionScopedEvent<{
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
type ViewUpdatedEvent = ConnectionScopedEvent<{
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
type AggregationExplainedEvent = ConnectionScopedEvent<{
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
type AggregationExportOpenedEvent = ConnectionScopedEvent<{
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
type AggregationExportedEvent = ConnectionScopedEvent<{
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
type AggregationCopiedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when the shell is open
 *
 * @category Shell
 */
type OpenShellEvent = ConnectionScopedEvent<{
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
type ShellEvent = ConnectionScopedEvent<{
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
type ConnectionDisconnectedEvent = ConnectionScopedEvent<{
  name: 'Connection Disconnected';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a new connection is saved.
 *
 * @category Connection
 */
type ConnectionCreatedEvent = ConnectionScopedEvent<{
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
type ConnectionRemovedEvent = ConnectionScopedEvent<{
  name: 'Connection Removed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when users attempts to connect to a server/cluster.
 *
 * @category Connection
 */
type ConnectionAttemptEvent = ConnectionScopedEvent<{
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
type NewConnectionEvent = ConnectionScopedEvent<{
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
     * The number of saved active connections (doesn't include new connections
     * that are not yet fully saved, like the ones created with the "New
     * Connection" button)
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
type ConnectionFailedEvent = ConnectionScopedEvent<{
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

    /**
     * The error codes (or code names) from the error's cause chain.
     * The driver and the OIDC library we use are two places that use cause chains.
     */
    error_code_cause_chain: (string | number)[] | undefined;
  } & ExtraConnectionData;
}>;

/**
 * This event is fired when connections export initiated from either UI or CLI.
 *
 * @category Connection
 */
type ConnectionExportedEvent = CommonEvent<{
  name: 'Connection Exported';
  payload: {
    /**
     * Number of connections exported.
     */
    count: number;
  };
}>;

/**
 * This event is fired when connections import initiated from either UI or CLI.
 *
 * @category Connection
 */
type ConnectionImportedEvent = CommonEvent<{
  name: 'Connection Imported';
  payload: {
    /**
     * Number of connections imported.
     */
    count: number;
  };
}>;

/**
 * This event is fired when user copies a document to the clipboard.
 *
 * @category Documents
 */
type DocumentCopiedEvent = ConnectionScopedEvent<{
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
type DocumentDeletedEvent = ConnectionScopedEvent<{
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
type DocumentUpdatedEvent = ConnectionScopedEvent<{
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
type DocumentClonedEvent = ConnectionScopedEvent<{
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
type DocumentInsertedEvent = ConnectionScopedEvent<{
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
type ExplainPlanExecutedEvent = ConnectionScopedEvent<{
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
type BulkUpdateOpenedEvent = ConnectionScopedEvent<{
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
type BulkUpdateExecutedEvent = ConnectionScopedEvent<{
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
type BulkDeleteOpenedEvent = ConnectionScopedEvent<{
  name: 'Bulk Delete Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user runs a bulk delete operation.
 *
 * @category Bulk Operations
 */
type BulkDeleteExecutedEvent = ConnectionScopedEvent<{
  name: 'Bulk Delete Executed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user runs a bulk update operation is added to
 * favorites.
 *
 * @category Bulk Operations
 */
type BulkUpdateFavoritedEvent = ConnectionScopedEvent<{
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
type UpdateExportOpenedEvent = ConnectionScopedEvent<{
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
type DeleteExportOpenedEvent = ConnectionScopedEvent<{
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
type UpdateExportedEvent = ConnectionScopedEvent<{
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
type DeleteExportedEvent = ConnectionScopedEvent<{
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
type ExportOpenedEvent = ConnectionScopedEvent<{
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
type ExportCompletedEvent = ConnectionScopedEvent<{
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
type ImportCompletedEvent = ConnectionScopedEvent<{
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
type ImportErrorLogOpenedEvent = ConnectionScopedEvent<{
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
type ImportOpenedEvent = ConnectionScopedEvent<{
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
type IndexCreateOpenedEvent = ConnectionScopedEvent<{
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
type IndexCreatedEvent = ConnectionScopedEvent<{
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
type IndexCreateFailedEvent = ConnectionScopedEvent<{
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
type IndexEditedEvent = ConnectionScopedEvent<{
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
type IndexDroppedEvent = ConnectionScopedEvent<{
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
type AiQueryFeedbackEvent = ConnectionScopedEvent<{
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
type AiResponseFailedEvent = ConnectionScopedEvent<{
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
type AiPromptSubmittedEvent = ConnectionScopedEvent<{
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
type AiResponseGeneratedEvent = ConnectionScopedEvent<{
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
 * This event is fired when the AI Opt-In Modal is shown to the user.
 *
 * @category Gen AI
 */
type AiOptInModalShownEvent = CommonEvent<{
  name: 'AI Opt In Modal Shown';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when the AI Opt-In Modal is dismissed by the user.
 *
 * @category Gen AI
 */
type AiOptInModalDismissedEvent = CommonEvent<{
  name: 'AI Opt In Modal Dismissed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when the AI Sign-In Modal is shown to the user.
 *
 * @category Gen AI
 */
type AiSignInModalShownEvent = CommonEvent<{
  name: 'AI Sign In Modal Shown';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when the AI Sign-In Modal is dismissed by the user.
 *
 * @category Gen AI
 */
type AiSignInModalDismissedEvent = CommonEvent<{
  name: 'AI Sign In Modal Dismissed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks the Generate Query / Aggregation entry point.
 *
 * @category Gen AI
 */
type AiGenerateQueryClickedEvent = CommonEvent<{
  name: 'AI Generate Query Clicked';
  payload: {
    /**
     * The type of query being generated.
     */
    type: 'aggregation' | 'query';
  };
}>;

/**
 * This event is fired when a user submits feedback for a pipeline generation.
 *
 * @category Gen AI
 */
type PipelineAiFeedbackEvent = ConnectionScopedEvent<{
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
type MyQueriesFilterEvent = CommonEvent<{
  name: 'My Queries Filter';
  payload: {
    /**
     * The filter that was changed.
     */
    type?: 'database' | 'collection';
  };
}>;

/**
 * This event is fired when user sorts items in the list using one of the
 * sort options.
 *
 * @category My Queries
 */
type MyQueriesSortEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when user filters queries using search
 * input (fires only on input blur).
 *
 * @category My Queries
 */
type MyQueriesSearchEvent = CommonEvent<{
  name: 'My Queries Search';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user copies to clipboard the query to export.
 *
 * @category Find Queries
 */
type QueryExportedEvent = ConnectionScopedEvent<{
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
type QueryExportOpenedEvent = ConnectionScopedEvent<{
  name: 'Query Export Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user executes a query
 *
 * @category Find Queries
 */
type QueryExecutedEvent = ConnectionScopedEvent<{
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

    /**
     * The view used to run the query.
     */
    mode: 'list' | 'json' | 'table';
  };
}>;

/**
 * This event is fired when user clicks the refresh button in the UI to refresh
 * the query results.
 *
 * @category Find Queries
 */
type QueryResultsRefreshedEvent = ConnectionScopedEvent<{
  name: 'Query Results Refreshed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user opens query history panel.
 *
 * @category Find Queries
 */
type QueryHistoryOpenedEvent = ConnectionScopedEvent<{
  name: 'Query History Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user closes query history panel
 *
 * @category Find Queries
 */
type QueryHistoryClosedEvent = ConnectionScopedEvent<{
  name: 'Query History Closed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user selects a favorite query to put it in the query bar.
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteUsedEvent = ConnectionScopedEvent<{
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
type QueryHistoryFavoriteRemovedEvent = ConnectionScopedEvent<{
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
type QueryHistoryFavoritesEvent = ConnectionScopedEvent<{
  name: 'Query History Favorites';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user selects "recent" in query history panel.
 *
 * @category Find Queries
 */
type QueryHistoryRecentEvent = ConnectionScopedEvent<{
  name: 'Query History Recent';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user selects a recent query to put it in the query bar.
 *
 * @category Find Queries
 */
type QueryHistoryRecentUsedEvent = ConnectionScopedEvent<{
  name: 'Query History Recent Used';
  payload: { isUpdateQuery: boolean };
}>;

/**
 * This event is fired when user favorites a recent query.
 *
 * @category Find Queries
 */
type QueryHistoryFavoriteAddedEvent = ConnectionScopedEvent<{
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
type QueryEditedEvent = ConnectionScopedEvent<{
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
type QueryHistoryFavoriteCopiedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when user edits validation rules (without saving them).
 *
 * @category Schema Validation
 */
type SchemaValidationEditedEvent = ConnectionScopedEvent<{
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
type SchemaValidationUpdatedEvent = ConnectionScopedEvent<{
  name: 'Schema Validation Updated';
  payload: {
    /**
     * The validation action passed to the driver.
     */
    validation_action: 'error' | 'warn' | 'errorAndLog';

    /**
     * The level of schema validation passed to the driver.
     */
    validation_level: 'off' | 'moderate' | 'strict';
  };
}>;

/**
 * This event is fired when user generates validation rules.
 *
 * @category Schema Validation
 */
type SchemaValidationGeneratedEvent = ConnectionScopedEvent<{
  name: 'Schema Validation Generated';
  payload: {
    /* The count of fields with multiple types in a given schema (not counting undefined).
     * This is only calculated for the top level fields, not nested fields and arrays.
     */
    variable_type_count: number;

    /**
     * The count of fields that don't appear on all documents.
     * This is only calculated for the top level fields, not nested fields and arrays.
     */
    optional_field_count: number;
  };
}>;

/**
 * This event is fired when user adds validation rules.
 *
 * @category Schema Validation
 */
type SchemaValidationAddedEvent = ConnectionScopedEvent<{
  name: 'Schema Validation Added';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user analyzes the schema.
 *
 * @category Schema
 */
type SchemaAnalyzedEvent = ConnectionScopedEvent<{
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
     * Key/value pairs of bsonType and count.
     */
    field_types: {
      [bsonType: string]: number;
    };

    /**
     * The count of fields with multiple types in a given schema (not counting undefined).
     * This is only calculated for the top level fields, not nested fields and arrays.
     */
    variable_type_count: number;

    /**
     * The count of fields that don't appear on all documents.
     * This is only calculated for the top level fields, not nested fields and arrays.
     */
    optional_field_count: number;

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
 * This event is fired when user analyzes the schema.
 *
 * @category Schema
 */
type SchemaAnalysisCancelledEvent = ConnectionScopedEvent<{
  name: 'Schema Analysis Cancelled';
  payload: {
    /**
     * Indicates whether a filter was applied during the schema analysis.
     */
    with_filter: boolean;

    /**
     * The time taken when analyzing the schema, before being cancelled, in milliseconds.
     */
    analysis_time_ms: number;
  };
}>;

/**
 * This event is fired when user shares the schema.
 *
 * @category Schema
 */
type SchemaExportedEvent = ConnectionScopedEvent<{
  name: 'Schema Exported';
  payload: {
    /**
     * Indicates whether the schema was analyzed before sharing.
     */
    has_schema: boolean;

    format: 'standardJSON' | 'mongoDBJSON' | 'expandedJSON' | 'legacyJSON';

    source: 'app_menu' | 'schema_tab';

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
 * This event is fired when user shares the schema.
 *
 * @category Schema
 */
type SchemaExportFailedEvent = ConnectionScopedEvent<{
  name: 'Schema Export Failed';
  payload: {
    /**
     * Indicates whether the schema was analyzed before sharing.
     */
    has_schema: boolean;

    schema_length: number;

    format: 'standardJSON' | 'mongoDBJSON' | 'expandedJSON' | 'legacyJSON';

    stage: string;
  };
}>;

/**
 * This event is fired when a user clicks to show the details of an operation.
 *
 * @category Performance Tab
 */
type CurrentOpShowOperationDetailsEvent = ConnectionScopedEvent<{
  name: 'CurrentOp showOperationDetails';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks to hide the details of an operation.
 *
 * @category Performance Tab
 */
type DetailViewHideOperationDetailsEvent = ConnectionScopedEvent<{
  name: 'DetailView hideOperationDetails';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks to kill an operation.
 *
 * @category Performance Tab
 */
type DetailViewKillOpEvent = ConnectionScopedEvent<{
  name: 'DetailView killOp';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user resumes a paused performance screen.
 *
 * @category Performance Tab
 */
type PerformanceResumedEvent = ConnectionScopedEvent<{
  name: 'Performance Resumed';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user pauses the performance screen.
 *
 * @category Performance Tab
 */
type PerformancePausedEvent = ConnectionScopedEvent<{
  name: 'Performance Paused';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when a user clicks "next" on a guide cue.
 *
 * @category Guide Cues
 */
type GuideCueDismissedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when a user clicks "next" on the last guide cue of a
 * guide cue group.
 *
 * @category Guide Cues
 */
type GuideCueGroupDismissedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when signal icon badge is rendered on the screen visible to the user.
 *
 * @category Proactive Performance Insights
 */
type SignalShownEvent = CommonEvent<{
  name: 'Signal Shown';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
}>;

/**
 * This event is fired when signal badge is clicked and popup is opened.
 *
 * @category Proactive Performance Insights
 */
type SignalOpenedEvent = CommonEvent<{
  name: 'Signal Opened';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
}>;

/**
 * This event is fired when Action button for the signal is clicked inside the popup.
 *
 * @category Proactive Performance Insights
 */
type SignalActionButtonClickedEvent = CommonEvent<{
  name: 'Signal Action Button Clicked';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
}>;

/**
 * This event is fired when "Learn more" link is clicked inside the signal popup.
 *
 * @category Proactive Performance Insights
 */
type SignalLinkClickedEvent = CommonEvent<{
  name: 'Signal Link Clicked';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
}>;

/**
 * This event is fired when user clicked the close button or outside the signal and closed the popup.
 *
 * @category Proactive Performance Insights
 */
type SignalClosedEvent = CommonEvent<{
  name: 'Signal Closed';
  payload: {
    /**
     * A unique identifier for the type of the signal.
     */
    id: string;
  };
}>;
/**
 * This event is fired when the "Update available" popup is shown and the user accepts the update.
 *
 * @category Auto-updates
 */
type AutoupdateAcceptedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when the user accepts to restart the application from the update popup.
 *
 * @category Auto-updates
 */
type ApplicationRestartAcceptedEvent = CommonEvent<{
  name: 'Application Restart Accepted';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when the auto-update feature is enabled.
 *
 * @category Auto-updates
 */
type AutoupdateEnabledEvent = CommonEvent<{
  name: 'Autoupdate Enabled';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when the auto-update feature is disabled.
 *
 * @category Auto-updates
 */
type AutoupdateDisabledEvent = CommonEvent<{
  name: 'Autoupdate Disabled';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when the "Update available" popup is shown and the user rejects the update.
 *
 * @category Auto-updates
 */
type AutoupdateDismissedEvent = CommonEvent<{
  name: 'Autoupdate Dismissed';
  payload: {
    /**
     * The version of the update that was dismissed.
     */
    update_version: string;
  };
}>;

/**
 * This event is fired when the user changes the items view type in the database and collection list between "list" and "grid".
 *
 * @category Database / Collection List
 */
type SwitchViewTypeEvent = ConnectionScopedEvent<{
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
type CollectionCreatedEvent = ConnectionScopedEvent<{
  name: 'Collection Created';
  payload: {
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
type DatabaseCreatedEvent = ConnectionScopedEvent<{
  name: 'Database Created';
  payload: {
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
type ThemeChangedEvent = CommonEvent<{
  name: 'Theme Changed';
  payload: {
    /**
     * The theme selected by the user. It can be 'DARK', 'LIGHT', or 'OS_THEME'.
     */
    theme: 'DARK' | 'LIGHT' | 'OS_THEME';
  };
}>;

/**
 * This event is fired at startup to report the First Contentful Paint metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type FirstContentfulPaintEvent = CommonEvent<{
  name: 'First Contentful Paint';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
}>;

/**
 * This event is fired at startup to report the Largest Contentful Paint metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type LargestContentfulPaintEvent = CommonEvent<{
  name: 'Largest Contentful Paint';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
}>;

/**
 * This event is fired at startup to report the First Input Delay metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type FirstInputDelayEvent = CommonEvent<{
  name: 'First Input Delay';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
}>;

/**
 * This event is fired at startup to report the Cumulative Layout Shift metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type CumulativeLayoutShiftEvent = CommonEvent<{
  name: 'Cumulative Layout Shift';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
}>;

/**
 * This event is fired at startup to report the Time to First Byte metric.
 * See: https://web.dev/articles/vitals.
 *
 * @category Web Vitals
 */
type TimeToFirstByteEvent = CommonEvent<{
  name: 'Time to First Byte';
  payload: {
    /**
     * The reported metric value.
     */
    value: number;
  };
}>;
/**
 * This event is fired when a user clicks on the Atlas CTA.
 *
 * @category Other
 */
type AtlasLinkClickedEvent = CommonEvent<{
  name: 'Atlas Link Clicked';
  payload: {
    /**
     * The screen from which the Atlas CTA was clicked.
     */
    screen?: 'agg_builder' | 'connect';
  };
}>;

/**
 * This event is fired when the application launch is initiated.
 *
 * @category Other
 */
type ApplicationLaunchedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when the keytar migration fails for a user.
 * See: https://jira.mongodb.org/browse/COMPASS-6856.
 *
 * NOTE: Should be removed as part of https://jira.mongodb.org/browse/COMPASS-7948.
 *
 * @category Other
 */
type KeytarSecretsMigrationFailedEvent = CommonEvent<{
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
}>;

/**
 * This event is fired when we fail to track another event due to an exception
 * while building the attributes.
 *
 * @category Other
 */
type ErrorFetchingAttributesEvent = CommonEvent<{
  name: 'Error Fetching Attributes';
  payload: {
    /**
     * The name of the event for which attributes could not be fetched.
     */
    event_name: string;
  };
}>;

/**
 * This event is fired when a user activates (i.e., navigates to) a screen.
 *
 * @category Other
 */
type ScreenEvent = ConnectionScopedEvent<{
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
      | 'update_search_index_modal'
      | 'end_of_life_mongodb_modal'
      | 'export_diagram_modal';
  };
}>;

/**
 * This event is fired when a user clicks on the Performance Advisor CTA.
 *
 * @category Other
 */
type PerformanceAdvisorClickedEvent = ConnectionScopedEvent<{
  name: 'Performance Advisor Clicked';
  payload: Record<string, never>;
}>;

/**
 * This event is fired at startup when we detect that the application is running on
 * a system that doesn't offer a suitable secret storage backend.
 *
 * @category Other
 */
type SecretStorageNotAvailableEvent = CommonEvent<{
  name: 'Secret Storage Not Available';
  payload: Record<string, never>;
}>;

type ExperimentViewedEvent = CommonEvent<{
  name: 'Experiment Viewed';
  payload: { test_name: string };
}>;

export type CreateIndexModalContext = 'Create Index Modal';

type CreateIndexButtonClickedEvent = CommonEvent<{
  name: 'Create Index Button Clicked';
  payload: {
    flow: 'Start with Query' | 'Start with Index' | undefined;
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexErrorParsingQueryEvent = CommonEvent<{
  name: 'Error parsing query';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexErrorGettingCoveredQueriesEvent = CommonEvent<{
  name: 'Error generating covered queries';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type UUIDEncounteredEvent = CommonEvent<{
  name: 'UUID Encountered';
  payload: {
    subtype: 3 | 4;
    count: number;
  };
}>;

type CreateIndexNewFieldAdded = CommonEvent<{
  name: 'New Index Field Added';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexOptionsClicked = CommonEvent<{
  name: 'Options Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexCoveredQueriesButtonClicked = CommonEvent<{
  name: 'Covered Queries Button Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexSuggestedIndexButtonClicked = CommonEvent<{
  name: 'Suggested Index Button Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexIndexTabClicked = CommonEvent<{
  name: 'Start with an Index Tab Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexQueryTabClicked = CommonEvent<{
  name: 'Start with a Query Tab Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexCodeEquivalentToggled = CommonEvent<{
  name: 'Code Equivalent Toggled';
  payload: {
    context: CreateIndexModalContext;
    toggled: 'On' | 'Off';
  };
}>;

type CreateIndexModalClosed = CommonEvent<{
  name: 'Create Index Modal Closed';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexModalCancelled = CommonEvent<{
  name: 'Cancel Button Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexProgrammingLanguageLinkClicked = CommonEvent<{
  name: 'View Programming Language Syntax Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexCoveredQueriesLearnMoreClicked = CommonEvent<{
  name: 'Covered Queries Learn More Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexESRLearnMoreClicked = CommonEvent<{
  name: 'ESR Learn More Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexInputIndexCopied = CommonEvent<{
  name: 'Input Index Copied';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexIndexSuggestionsCopied = CommonEvent<{
  name: 'Index Suggestions Copied';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

type CreateIndexStrategiesDocumentationClicked = CommonEvent<{
  name: 'Index Strategies Documentation Clicked';
  payload: {
    context: CreateIndexModalContext;
  };
}>;

/**
 * This event is fired when a new data modeling diagram is created
 *
 * @category Data Modeling
 */
type DataModelingDiagramCreated = CommonEvent<{
  name: 'Data Modeling Diagram Created';
  payload: {
    num_collections: number;
  };
}>;

/**
 * This event is fired when user exports data modeling diagram.
 *
 * @category Data Modeling
 */
type DataModelingDiagramExported = CommonEvent<{
  name: 'Data Modeling Diagram Exported';
  payload: {
    format: 'png' | 'json' | 'diagram';
  };
}>;

/**
 * This event is fired when user imports data modeling diagram.
 *
 * @category Data Modeling
 */
type DataModelingDiagramImported = CommonEvent<{
  name: 'Data Modeling Diagram Imported';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user adds a new relationship to a data modeling diagram.
 *
 * @category Data Modeling
 */
type DataModelingDiagramRelationshipAdded = CommonEvent<{
  name: 'Data Modeling Relationship Added';
  payload: {
    num_relationships: number;
  };
}>;

/**
 * This event is fired when user edits a relationship in a data modeling diagram.
 *
 * @category Data Modeling
 */
type DataModelingDiagramRelationshipEdited = CommonEvent<{
  name: 'Data Modeling Relationship Form Opened';
  payload: Record<string, never>;
}>;

/**
 * This event is fired when user deletes a relationship from a data modeling diagram.
 *
 * @category Data Modeling
 */
type DataModelingDiagramRelationshipDeleted = CommonEvent<{
  name: 'Data Modeling Relationship Deleted';
  payload: {
    num_relationships: number;
  };
}>;

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
  | AiOptInModalShownEvent
  | AiOptInModalDismissedEvent
  | AiSignInModalShownEvent
  | AiSignInModalDismissedEvent
  | AiGenerateQueryClickedEvent
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
  | DataModelingDiagramCreated
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
  | SchemaAnalysisCancelledEvent
  | SchemaAnalyzedEvent
  | SchemaExportedEvent
  | SchemaExportFailedEvent
  | SchemaValidationAddedEvent
  | SchemaValidationEditedEvent
  | SchemaValidationUpdatedEvent
  | SchemaValidationGeneratedEvent
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
  | SecretStorageNotAvailableEvent
  | FirstContentfulPaintEvent
  | LargestContentfulPaintEvent
  | FirstInputDelayEvent
  | CumulativeLayoutShiftEvent
  | TimeToFirstByteEvent
  | ExperimentViewedEvent
  | CreateIndexButtonClickedEvent
  | CreateIndexErrorParsingQueryEvent
  | CreateIndexErrorGettingCoveredQueriesEvent
  | CreateIndexCodeEquivalentToggled
  | CreateIndexCoveredQueriesButtonClicked
  | CreateIndexCoveredQueriesLearnMoreClicked
  | CreateIndexESRLearnMoreClicked
  | CreateIndexIndexTabClicked
  | CreateIndexModalCancelled
  | CreateIndexModalClosed
  | CreateIndexNewFieldAdded
  | CreateIndexOptionsClicked
  | CreateIndexProgrammingLanguageLinkClicked
  | CreateIndexQueryTabClicked
  | CreateIndexSuggestedIndexButtonClicked
  | CreateIndexInputIndexCopied
  | CreateIndexIndexSuggestionsCopied
  | CreateIndexStrategiesDocumentationClicked
  | UUIDEncounteredEvent
  | DataModelingDiagramExported
  | DataModelingDiagramImported
  | DataModelingDiagramRelationshipAdded
  | DataModelingDiagramRelationshipEdited
  | DataModelingDiagramRelationshipDeleted;

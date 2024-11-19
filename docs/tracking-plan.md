
# Compass Tracking Plan

Generated on Tue, Nov 19, 2024 at 01:58 AM

## Table of Contents

### Identify
- [Identify Traits](#event--IdentifyTraits)

### Aggregation Builder
- [Aggregation Canceled](#event--AggregationCanceledEvent)
- [Aggregation Copied](#event--AggregationCopiedEvent)
- [Aggregation Deleted](#event--AggregationDeletedEvent)
- [Aggregation Edited](#event--AggregationEditedEvent)
- [Aggregation Executed](#event--AggregationExecutedEvent)
- [Aggregation Explained](#event--AggregationExplainedEvent)
- [Aggregation Exported](#event--AggregationExportedEvent)
- [Aggregation Export Opened](#event--AggregationExportOpenedEvent)
- [Aggregation Opened](#event--AggregationOpenedEvent)
- [Aggregation Saved As View](#event--AggregationSavedAsViewEvent)
- [Aggregation Saved](#event--AggregationSavedEvent)
- [Aggregation Side Panel Opened](#event--AggregationSidePanelOpenedEvent)
- [Aggregation Timed Out](#event--AggregationTimedOutEvent)
- [Aggregation Use Case Added](#event--AggregationUseCaseAddedEvent)
- [Aggregation Use Case Saved](#event--AggregationUseCaseSavedEvent)
- [Editor Type Changed](#event--EditorTypeChangedEvent)
- [Focus Mode Closed](#event--FocusModeClosedEvent)
- [Focus Mode Opened](#event--FocusModeOpenedEvent)
- [View Updated](#event--ViewUpdatedEvent)

### Atlas
- [Atlas Sign In Error](#event--AtlasSignInErrorEvent)
- [Atlas Sign In Success](#event--AtlasSignInSuccessEvent)
- [Atlas Sign Out](#event--AtlasSignOutEvent)

### Auto-updates
- [Autoupdate Accepted](#event--AutoupdateAcceptedEvent)
- [Autoupdate Dismissed](#event--AutoupdateDismissedEvent)
- [Application Restart Accepted](#event--ApplicationRestartAcceptedEvent)
- [Autoupdate Enabled](#event--AutoupdateEnabledEvent)
- [Autoupdate Disabled](#event--AutoupdateDisabledEvent)

### Bulk Operations
- [Bulk Delete Executed](#event--BulkDeleteExecutedEvent)
- [Bulk Delete Opened](#event--BulkDeleteOpenedEvent)
- [Bulk Update Executed](#event--BulkUpdateExecutedEvent)
- [Bulk Update Favorited](#event--BulkUpdateFavoritedEvent)
- [Bulk Update Opened](#event--BulkUpdateOpenedEvent)
- [Delete Exported](#event--DeleteExportedEvent)
- [Delete Export Opened](#event--DeleteExportOpenedEvent)
- [Update Exported](#event--UpdateExportedEvent)
- [Update Export Opened](#event--UpdateExportOpenedEvent)

### Connection
- [Connection Attempt](#event--ConnectionAttemptEvent)
- [Connection Created](#event--ConnectionCreatedEvent)
- [Connection Disconnected](#event--ConnectionDisconnectedEvent)
- [Connection Exported](#event--ConnectionExportedEvent)
- [Connection Failed](#event--ConnectionFailedEvent)
- [Connection Imported](#event--ConnectionImportedEvent)
- [Connection Removed](#event--ConnectionRemovedEvent)
- [New Connection](#event--NewConnectionEvent)

### Database / Collection List
- [Collection Created](#event--CollectionCreatedEvent)
- [Database Created](#event--DatabaseCreatedEvent)
- [Switch View Type](#event--SwitchViewTypeEvent)

### Documents
- [Document Cloned](#event--DocumentClonedEvent)
- [Document Copied](#event--DocumentCopiedEvent)
- [Document Deleted](#event--DocumentDeletedEvent)
- [Document Inserted](#event--DocumentInsertedEvent)
- [Document Updated](#event--DocumentUpdatedEvent)

### Explain
- [Explain Plan Executed](#event--ExplainPlanExecutedEvent)

### Find Queries
- [Query Edited](#event--QueryEditedEvent)
- [Query Executed](#event--QueryExecutedEvent)
- [Query Exported](#event--QueryExportedEvent)
- [Query Export Opened](#event--QueryExportOpenedEvent)
- [Query History Closed](#event--QueryHistoryClosedEvent)
- [Query History Favorite Added](#event--QueryHistoryFavoriteAddedEvent)
- [Query History Favorite Copied](#event--QueryHistoryFavoriteCopiedEvent)
- [Query History Favorite Removed](#event--QueryHistoryFavoriteRemovedEvent)
- [Query History Favorites](#event--QueryHistoryFavoritesEvent)
- [Query History Favorite Used](#event--QueryHistoryFavoriteUsedEvent)
- [Query History Opened](#event--QueryHistoryOpenedEvent)
- [Query History Recent](#event--QueryHistoryRecentEvent)
- [Query History Recent Used](#event--QueryHistoryRecentUsedEvent)
- [Query Results Refreshed](#event--QueryResultsRefreshedEvent)

### Gen AI
- [AI Prompt Submitted](#event--AiPromptSubmittedEvent)
- [AI Query Feedback](#event--AiQueryFeedbackEvent)
- [AI Response Failed](#event--AiResponseFailedEvent)
- [AI Response Generated](#event--AiResponseGeneratedEvent)
- [PipelineAI Feedback](#event--PipelineAiFeedbackEvent)

### Guide Cues
- [Guide Cue Dismissed](#event--GuideCueDismissedEvent)
- [Guide Cue Group Dismissed](#event--GuideCueGroupDismissedEvent)

### Import/Export
- [Export Completed](#event--ExportCompletedEvent)
- [Export Opened](#event--ExportOpenedEvent)
- [Import Completed](#event--ImportCompletedEvent)
- [Import Error Log Opened](#event--ImportErrorLogOpenedEvent)
- [Import Opened](#event--ImportOpenedEvent)

### Indexes
- [Index Created](#event--IndexCreatedEvent)
- [Index Create Failed](#event--IndexCreateFailedEvent)
- [Index Create Opened](#event--IndexCreateOpenedEvent)
- [Index Dropped](#event--IndexDroppedEvent)
- [Index Edited](#event--IndexEditedEvent)

### My Queries
- [My Queries Filter](#event--MyQueriesFilterEvent)
- [My Queries Search](#event--MyQueriesSearchEvent)
- [My Queries Sort](#event--MyQueriesSortEvent)

### Other
- [Application Launched](#event--ApplicationLaunchedEvent)
- [Atlas Link Clicked](#event--AtlasLinkClickedEvent)
- [Error Fetching Attributes](#event--ErrorFetchingAttributesEvent)
- [Keytar Secrets Migration Failed](#event--KeytarSecretsMigrationFailedEvent)
- [Performance Advisor Clicked](#event--PerformanceAdvisorClickedEvent)
- [Screen](#event--ScreenEvent)
- [Secret Storage Not Available](#event--SecretStorageNotAvailable)

### Performance Tab
- [CurrentOp showOperationDetails](#event--CurrentOpShowOperationDetailsEvent)
- [DetailView hideOperationDetails](#event--DetailViewHideOperationDetailsEvent)
- [DetailView killOp](#event--DetailViewKillOpEvent)
- [Performance Paused](#event--PerformancePausedEvent)
- [Performance Resumed](#event--PerformanceResumedEvent)

### Proactive Performance Insights
- [Signal Action Button Clicked](#event--SignalActionButtonClickedEvent)
- [Signal Closed](#event--SignalClosedEvent)
- [Signal Link Clicked](#event--SignalLinkClickedEvent)
- [Signal Opened](#event--SignalOpenedEvent)
- [Signal Shown](#event--SignalShownEvent)

### Schema
- [Schema Analyzed](#event--SchemaAnalyzedEvent)
- [Schema Exported](#event--SchemaExportedEvent)

### Schema Validation
- [Schema Validation Added](#event--SchemaValidationAddedEvent)
- [Schema Validation Edited](#event--SchemaValidationEditedEvent)
- [Schema Validation Updated](#event--SchemaValidationUpdatedEvent)

### Settings
- [Theme Changed](#event--ThemeChangedEvent)

### Shell
- [Open Shell](#event--OpenShellEvent)
- [`Shell ${string}`](#event--ShellEvent)

### Web Vitals
- [First Contentful Paint](#event--FirstContentfulPaintEvent)
- [Largest Contentful Paint](#event--LargestContentfulPaintEvent)
- [First Input Delay](#event--FirstInputDelayEvent)
- [Cumulative Layout Shift](#event--CumulativeLayoutShiftEvent)
- [Time to First Byte](#event--TimeToFirstByteEvent)



## Identify

<a name="event--IdentifyTraits"></a>

### Identify Traits

Traits sent along with the Segment identify call

**Properties**:

- **compass_version** (required): `string`
  - Shortened version number (e.g., '1.29').
- **compass_full_version** (required): `string`
  - The full version of the Compass application, including additional identifiers
such as build metadata or pre-release tags (e.g., '1.29.0-beta.1').
- **compass_distribution** (required): `"compass" | "compass-readonly" | "compass-isolated"`
  - The distribution of Compass being used.
- **compass_channel** (required): `"stable" | "beta" | "dev"`
  - The release channel of Compass.
- 'stable' for the general release.
- 'beta' for pre-release versions intended for testing.
- 'dev' for development versions only distributed internally.
- **platform** (required): `string`
  - The platform on which Compass is running, derived from Node.js `os.platform()`.
Corresponds to the operating system (e.g., 'darwin' for macOS, 'win32' for Windows, 'linux' for Linux).
- **arch** (required): `string`
  - The architecture of the system's processor, derived from Node.js `os.arch()`.
'x64' for 64-bit processors and 'arm' for ARM processors.
- **os_type** (optional): `string | undefined`
  - The type of operating system, including specific operating system
names or types (e.g., 'Linux', 'Windows_NT', 'Darwin').
- **os_version** (optional): `string | undefined`
  - Detailed kernel or system version information.
Example: 'Darwin Kernel Version 21.4.0: Fri Mar 18 00:45:05 PDT 2022; root:xnu-8020.101.4~15/RELEASE_X86_64'.
- **os_arch** (optional): `string | undefined`
  - The architecture of the operating system, if available, which might be more specific
than the system's processor architecture (e.g., 'x86_64' for 64-bit architecture).
- **os_release** (optional): `string | undefined`
  - The release identifier of the operating system.
This can provide additional details about the operating system release or
version (e.g. the kernel version for a specific macOS release).

NOTE: This property helps determine the macOS version in use. The reported
version corresponds to the Darwin kernel version, which can be mapped
to the respective macOS release using the conversion table available at:
https://en.wikipedia.org/wiki/MacOS_version_history.
- **os_linux_dist** (optional): `string | undefined`
  - The Linux distribution name, if running on a Linux-based operating system,
derived by reading from `/etc/os-release`.
Examples include 'ubuntu', 'debian', or 'rhel'.
- **os_linux_release** (optional): `string | undefined`
  - The version of the Linux distribution, if running on a Linux-based operating system,
derived by reading from `/etc/os-release`.
Examples include '20.04' for Ubuntu or '10' for Debian.


## Aggregation Builder

<a name="event--AggregationCanceledEvent"></a>

### Aggregation Canceled

This event is fired when a user cancel a running aggregation.

<a name="event--AggregationCopiedEvent"></a>

### Aggregation Copied

This event is fired when user copied the pipeline to clipboard.

**Properties**:

- **id** (required): `string`
  - A unique id for the aggregation object being copied.
- **screen** (required): `"my-queries"`
  - The screen from which the aggregation has been copied.

<a name="event--AggregationDeletedEvent"></a>

### Aggregation Deleted

This event is fired when user deletes a previously saved aggregation pipeline.

**Properties**:

- **id** (optional): `string | undefined`
  - A unique id for the aggregation object being deleted.
- **editor_view_type** (optional): `"stage" | "text" | "focus" | undefined`
  - The type of editor view from which the aggregation has been deleted.
- **screen** (optional): `"my_queries" | "aggregations" | undefined`
  - The screen from which the aggregation has been deleted.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationEditedEvent"></a>

### Aggregation Edited

This event is fired when user adds/remove a stage or changes the stage name
in the stage editor view.

**Properties**:

- **num_stages** (optional): `number | undefined`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **editor_view_type** (optional): `"stage" | "text" | "focus" | undefined`
  - The type of view used to edit the aggregation.
- **stage_index** (optional): `number | undefined`
  - The index of the stage being edited.
- **stage_action** (optional): `"stage_content_changed" | "stage_renamed" | "stage_added" | "stage_deleted" | "stage_reordered" | undefined`
  - The edit action being performed for stage and focus mode.
- **stage_name** (optional): `string | null | undefined`
  - The name of the stage edited.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationExecutedEvent"></a>

### Aggregation Executed

This event is fired when user runs the aggregation.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **editor_view_type** (required): `"stage" | "text" | "focus"`
  - The type of editor view from which the aggregation has been executed.
- **stage_operators** (required): `{}`
  - The names of the stages in the pipeline being executed.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationExplainedEvent"></a>

### Aggregation Explained

This event is fired when user runs the explain plan for an aggregation.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **index_used** (required): `boolean`
  - Wether the explain reports that an index was used by the query.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationExportedEvent"></a>

### Aggregation Exported

This event is fired when user copies to clipboard the aggregation to export.

**Properties**:

- **num_stages** (optional): `number | undefined`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **language** (optional): `"java" | "javascript" | "csharp" | "python" | "ruby" | "go" | "rust" | "php" | undefined`
  - The language to which the query has been exported.
- **with_import_statements** (optional): `boolean | undefined`
  - Indicates that the query was exported including import statements.
- **with_drivers_syntax** (optional): `boolean | undefined`
  - Indicates that the query was exported including driver syntax.
- **with_builders** (optional): `boolean | undefined`
  - Indicates that the query was exported using builder syntax.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationExportOpenedEvent"></a>

### Aggregation Export Opened

This event is fired when user opens the export to language dialog.

**Properties**:

- **num_stages** (optional): `number | undefined`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationOpenedEvent"></a>

### Aggregation Opened

This event is fired when user opens a previously saved aggregation pipeline.

**Properties**:

- **id** (optional): `string | undefined`
  - A unique id for the aggregation object being opened.
- **editor_view_type** (optional): `"stage" | "text" | "focus" | undefined`
  - The type of editor view from which the aggregation is being opened.
- **screen** (optional): `"my_queries" | "aggregations" | undefined`
  - The screen from which the aggregation is being opened.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationSavedAsViewEvent"></a>

### Aggregation Saved As View

This event is fired when user saves aggregation pipeline as a view

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationSavedEvent"></a>

### Aggregation Saved

This event is fired when user saves aggregation pipeline.

**Properties**:

- **id** (required): `string`
  - A unique id for the aggregation object being saved.
- **num_stages** (optional): `number | undefined`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **editor_view_type** (required): `"stage" | "text" | "focus"`
  - The type of editor view from which the aggregation is being saved.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationSidePanelOpenedEvent"></a>

### Aggregation Side Panel Opened

This event is fired when user clicks the aggregation side panel button.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationTimedOutEvent"></a>

### Aggregation Timed Out

This event is fired when an aggregation times out

**Properties**:

- **max_time_ms** (required): `number | null`
  - The max_time_ms setting of the aggregation timed out.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationUseCaseAddedEvent"></a>

### Aggregation Use Case Added

This event is fired when user selects a use case from the aggregation panel.

**Properties**:

- **drag_and_drop** (optional): `boolean | undefined`
  - Specifies if the use case was added via drag and drop.
- **stage_name** (optional): `string | undefined`
  - The name of the stage added.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AggregationUseCaseSavedEvent"></a>

### Aggregation Use Case Saved

This event is fired when users saves a completed use case form, adding
the stage to their pipeline.

**Properties**:

- **stage_name** (required): `string | null`
  - The name of the stage the use case refers to.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--EditorTypeChangedEvent"></a>

### Editor Type Changed

This event is fired when user changes editor type.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **editor_view_type** (required): `"stage" | "text" | "focus"`
  - The new type of view that editor was changed to.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--FocusModeClosedEvent"></a>

### Focus Mode Closed

This event is fired when user clicks to minimize focus mode.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **duration** (required): `number`
  - Time elapsed between the focus mode has been opened and then closed
(in milliseconds).
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--FocusModeOpenedEvent"></a>

### Focus Mode Opened

This event is fired when user clicks to expand focus mode.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ViewUpdatedEvent"></a>

### View Updated

This event is fired when user updates a collection view they had opened in the agg
builder.

**Properties**:

- **num_stages** (required): `number`
  - The number of stages present in the aggregation at the moment when
the even has been fired.
- **editor_view_type** (required): `"stage" | "text" | "focus"`
  - The type of editor view from which the view has been updated.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Atlas

<a name="event--AtlasSignInErrorEvent"></a>

### Atlas Sign In Error

This event is fired when user failed to sign in to their Atlas account.

**Properties**:

- **error** (required): `string`
  - The error message reported on sign in.

<a name="event--AtlasSignInSuccessEvent"></a>

### Atlas Sign In Success

This event is fired when user successfully signed in to their Atlas account

**Properties**:

- **auid** (required): `string`
  - The id of the atlas user who signed in.

<a name="event--AtlasSignOutEvent"></a>

### Atlas Sign Out

This event is fired when user signed out from their Atlas account.

**Properties**:

- **auid** (required): `string`
  - The id of the atlas user who signed out.


## Auto-updates

<a name="event--AutoupdateAcceptedEvent"></a>

### Autoupdate Accepted

This event is fired when the "Update available" popup is shown and the user accepts the update.

**Properties**:

- **update_version** (optional): `string | undefined`
  - The version of the update that was accepted.
- **manual_update** (optional): `boolean | undefined`
  - Indicates whether the update was initiated manually by the user.
- **manual_download** (optional): `boolean | undefined`
  - Indicates whether the update was downloaded manually by the user.

<a name="event--AutoupdateDismissedEvent"></a>

### Autoupdate Dismissed

This event is fired when the "Update available" popup is shown and the user rejects the update.

**Properties**:

- **update_version** (required): `string`
  - The version of the update that was dismissed.

<a name="event--ApplicationRestartAcceptedEvent"></a>

### Application Restart Accepted

This event is fired when the user accepts to restart the application from the update popup.

<a name="event--AutoupdateEnabledEvent"></a>

### Autoupdate Enabled

This event is fired when the auto-update feature is enabled.

<a name="event--AutoupdateDisabledEvent"></a>

### Autoupdate Disabled

This event is fired when the auto-update feature is disabled.


## Bulk Operations

<a name="event--BulkDeleteExecutedEvent"></a>

### Bulk Delete Executed

This event is fired when a user runs a bulk delete operation.

<a name="event--BulkDeleteOpenedEvent"></a>

### Bulk Delete Opened

This event is fired when a user opens the bulk delete modal.

<a name="event--BulkUpdateExecutedEvent"></a>

### Bulk Update Executed

This event is fired when a user runs a bulk update operation.

**Properties**:

- **isUpdatePreviewSupported** (required): `boolean`
  - Specifies if update preview was supported (the update preview runs inside a transaction.)
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--BulkUpdateFavoritedEvent"></a>

### Bulk Update Favorited

This event is fired when a user runs a bulk update operation is added to
favorites.

**Properties**:

- **isUpdatePreviewSupported** (required): `boolean`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--BulkUpdateOpenedEvent"></a>

### Bulk Update Opened

This event is fired when a user opens the bulk update modal.

**Properties**:

- **isUpdatePreviewSupported** (required): `boolean`
  - Specifies if update preview was supported (the update preview runs inside a transaction.)
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DeleteExportedEvent"></a>

### Delete Exported

NOTE: NOT IMPLEMENTED YET.
This event is fired when user copies to clipboard the delete query to export
TODO: https://jira.mongodb.org/browse/COMPASS-7334

**Properties**:

- **language** (optional): `"java" | "javascript" | "csharp" | "python" | "ruby" | "go" | "rust" | "php" | undefined`
- **with_import_statements** (optional): `boolean | undefined`
- **with_drivers_syntax** (optional): `boolean | undefined`
- **with_builders** (optional): `boolean | undefined`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DeleteExportOpenedEvent"></a>

### Delete Export Opened

NOTE: NOT IMPLEMENTED YET.
This event is fired when the export to language dialog is open for a delete operation.
TODO: https://jira.mongodb.org/browse/COMPASS-7334

<a name="event--UpdateExportedEvent"></a>

### Update Exported

NOTE: NOT IMPLEMENTED YET.
This event is fired when user copies to clipboard the update query to export
TODO: https://jira.mongodb.org/browse/COMPASS-7334

**Properties**:

- **language** (optional): `"java" | "javascript" | "csharp" | "python" | "ruby" | "go" | "rust" | "php" | undefined`
- **with_import_statements** (optional): `boolean | undefined`
- **with_drivers_syntax** (optional): `boolean | undefined`
- **with_builders** (optional): `boolean | undefined`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--UpdateExportOpenedEvent"></a>

### Update Export Opened

NOTE: NOT IMPLEMENTED YET.
This event is fired when the export to language dialog is open for an update operation.
TODO: https://jira.mongodb.org/browse/COMPASS-7334


## Connection

<a name="event--ConnectionAttemptEvent"></a>

### Connection Attempt

This event is fired when users attempts to connect to a server/cluster.

**Properties**:

- **is_favorite** (required): `boolean`
  - Specifies if the connection is a favorite.
- **is_new** (required): `boolean`
  - Specifies if the connection is a newly created connection.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ConnectionCreatedEvent"></a>

### Connection Created

This event is fired when a new connection is saved.

**Properties**:

- **color** (optional): `string | undefined`
  - The favorite color for the connection created.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ConnectionDisconnectedEvent"></a>

### Connection Disconnected

This event is fired when an active connection is disconnected.

<a name="event--ConnectionExportedEvent"></a>

### Connection Exported

This event is fired when connections export initiated from either UI or CLI.

**Properties**:

- **count** (required): `number`
  - Number of connections exported.

<a name="event--ConnectionFailedEvent"></a>

### Connection Failed

This event is fired when a connection attempt fails.

**Properties**:

- **error_code** (optional): `string | number | undefined`
  - The error code (if available).
- **error_name** (required): `string`
  - The error name.
- **auth_type** (optional): `string | undefined`
  - Desktop only. The authentication type used in the connection.
- **tunnel** (optional): `string | undefined`
  - Desktop only. The type of tunneling used in the connection.
- **is_srv** (optional): `boolean | undefined`
  - Desktop only. Specifies if SRV is used in the connection.
- **is_localhost** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection is targeting localhost.
- **is_atlas_url** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection URL is an Atlas URL.
- **is_do_url** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection URL is a DigitalOcean URL.
- **is_public_cloud** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection is in a public cloud.
- **public_cloud_name** (optional): `string | undefined`
  - The name of the public cloud provider, if applicable.
- **is_csfle** (optional): `boolean | undefined`
  - Specifies if Client-Side Field Level Encryption (CSFLE) is used.
- **has_csfle_schema** (optional): `boolean | undefined`
  - Specifies if CSFLE schema is present.
- **count_kms_aws** (optional): `number | undefined`
  - Specifies the number of AWS KMS providers used.
- **count_kms_gcp** (optional): `number | undefined`
  - Specifies the number of GCP KMS providers used.
- **count_kms_kmip** (optional): `number | undefined`
  - Specifies the number of KMIP KMS providers used.
- **count_kms_local** (optional): `number | undefined`
  - Specifies the number of Local KMS providers used.
- **count_kms_azure** (optional): `number | undefined`
  - Specifies the number of Azure KMS providers used.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ConnectionImportedEvent"></a>

### Connection Imported

This event is fired when connections import initiated from either UI or CLI.

**Properties**:

- **count** (required): `number`
  - Number of connections imported.

<a name="event--ConnectionRemovedEvent"></a>

### Connection Removed

This event is fired when a connection is removed.

<a name="event--NewConnectionEvent"></a>

### New Connection

This event is fired when user successfully connects to a new server/cluster.

**Properties**:

- **is_atlas** (required): `boolean`
  - Specifies if the connection is targeting an Atlas cluster.
- **atlas_hostname** (required): `string | null`
  - The first resolved SRV hostname in case the connection is targeting an Atlas cluster.
- **is_local_atlas** (required): `boolean`
  - Specifies that the connection is targeting an Atlas local deployment.
- **is_dataLake** (required): `boolean`
  - Specifies that the connection is targeting an Atlas Data Federation deployment.
- **is_enterprise** (required): `boolean`
  - Specifies that the connection is targeting an Atlas Enterprise deployment.
- **is_genuine** (required): `boolean`
  - Specifies if the connection is targeting a genuine MongoDB deployment.
- **non_genuine_server_name** (required): `string`
  - The advertised server name, in case of non-genuine deployment.
- **server_version** (required): `string`
  - The version of the connected server.
- **server_arch** (optional): `string | undefined`
  - The host architecture of the connected server.
- **server_os_family** (optional): `string | undefined`
  - The OS family of the connected server.
- **topology_type** (required): `string`
  - The type of connected topology.
- **num_active_connections** (required): `number`
  - The number of active connections.
- **num_inactive_connections** (required): `number`
  - The number of inactive connections.
- **auth_type** (optional): `string | undefined`
  - Desktop only. The authentication type used in the connection.
- **tunnel** (optional): `string | undefined`
  - Desktop only. The type of tunneling used in the connection.
- **is_srv** (optional): `boolean | undefined`
  - Desktop only. Specifies if SRV is used in the connection.
- **is_localhost** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection is targeting localhost.
- **is_atlas_url** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection URL is an Atlas URL.
- **is_do_url** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection URL is a DigitalOcean URL.
- **is_public_cloud** (optional): `boolean | undefined`
  - Desktop only. Specifies if the connection is in a public cloud.
- **public_cloud_name** (optional): `string | undefined`
  - The name of the public cloud provider, if applicable.
- **is_csfle** (optional): `boolean | undefined`
  - Specifies if Client-Side Field Level Encryption (CSFLE) is used.
- **has_csfle_schema** (optional): `boolean | undefined`
  - Specifies if CSFLE schema is present.
- **count_kms_aws** (optional): `number | undefined`
  - Specifies the number of AWS KMS providers used.
- **count_kms_gcp** (optional): `number | undefined`
  - Specifies the number of GCP KMS providers used.
- **count_kms_kmip** (optional): `number | undefined`
  - Specifies the number of KMIP KMS providers used.
- **count_kms_local** (optional): `number | undefined`
  - Specifies the number of Local KMS providers used.
- **count_kms_azure** (optional): `number | undefined`
  - Specifies the number of Azure KMS providers used.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Database / Collection List

<a name="event--CollectionCreatedEvent"></a>

### Collection Created

This event is fired when a collection is created.

**Properties**:

- **is_capped** (required): `boolean`
  - Indicates whether the collection is capped.
- **has_collation** (required): `boolean`
  - Indicates whether the collection has a custom collation.
- **is_timeseries** (required): `boolean`
  - Indicates whether the collection is a time series collection.
- **is_clustered** (required): `boolean`
  - Indicates whether the collection is clustered.
- **is_fle2** (required): `boolean`
  - Indicates whether the collection is encrypted using FLE2 (Field-Level Encryption 2).
- **expires** (required): `boolean`
  - Indicates whether the collection has an expiration (TTL index).
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DatabaseCreatedEvent"></a>

### Database Created

This event is fired when a database is created.

**Properties**:

- **is_capped** (required): `boolean`
  - Indicates whether the first collection in the database is capped.
- **has_collation** (required): `boolean`
  - Indicates whether the first collection in the database has a custom collation.
- **is_timeseries** (required): `boolean`
  - Indicates whether the first collection in the database is a time series collection.
- **is_clustered** (required): `boolean`
  - Indicates whether the first collection in the database is clustered.
- **is_fle2** (required): `boolean`
  - Indicates whether the first collection in the database is encrypted using FLE2 (Field-Level Encryption 2).
- **expires** (required): `boolean`
  - Indicates whether the first collection in the database has an expiration (TTL index).
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--SwitchViewTypeEvent"></a>

### Switch View Type

This event is fired when the user changes the items view type between list and grid.

**Properties**:

- **view_type** (required): `"list" | "grid"`
  - The type of view that the user switched to.
- **item_type** (required): `"database" | "collection"`
  - The type of item being viewed, either 'collection' or 'database'.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Documents

<a name="event--DocumentClonedEvent"></a>

### Document Cloned

This event is fired when user clones a document.

**Properties**:

- **mode** (required): `"list" | "json" | "table"`
  - The view used to clone the document.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DocumentCopiedEvent"></a>

### Document Copied

This event is fired when user copies a document to the clipboard.

**Properties**:

- **mode** (required): `"list" | "json" | "table"`
  - The view used to copy the document.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DocumentDeletedEvent"></a>

### Document Deleted

This event is fired when user deletes a document.

**Properties**:

- **mode** (required): `"list" | "json" | "table"`
  - The view used to delete the document.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DocumentInsertedEvent"></a>

### Document Inserted

This event is fired when user inserts documents.

**Properties**:

- **mode** (optional): `string | undefined`
  - The view used to insert documents.
- **multiple** (optional): `boolean | undefined`
  - Specifies if the user inserted multiple documents.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--DocumentUpdatedEvent"></a>

### Document Updated

This event is fired when user updates a document

**Properties**:

- **mode** (required): `"list" | "json" | "table"`
  - The view used to delete the document.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Explain

<a name="event--ExplainPlanExecutedEvent"></a>

### Explain Plan Executed

This event is fired when user explains a query.

**Properties**:

- **with_filter** (required): `boolean`
  - Specifies if a filter was set.
- **index_used** (required): `boolean`
  - Specifies if the explain reports that an index was used by the query.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Find Queries

<a name="event--QueryEditedEvent"></a>

### Query Edited

This event is fired when a user edits a query.

**Properties**:

- **option_name** (required): `"maxTimeMS" | "filter" | "project" | "collation" | "sort" | "skip" | "limit" | "hint"`
  - The name of the edited field.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryExecutedEvent"></a>

### Query Executed

This event is fired when user executes a query

**Properties**:

- **has_projection** (required): `boolean`
  - Indicates whether the query includes a projection.
- **has_skip** (required): `boolean`
  - Indicates whether the query includes a skip operation.
- **has_sort** (required): `boolean`
  - Indicates whether the query includes a sort operation.
- **has_limit** (required): `boolean`
  - Indicates whether the query includes a limit operation.
- **has_collation** (required): `boolean`
  - Indicates whether the query includes a collation.
- **changed_maxtimems** (required): `boolean`
  - Indicates whether the maxTimeMS option was modified for the query.
- **collection_type** (required): `string`
  - The type of the collection on which the query was executed.
- **used_regex** (required): `boolean`
  - Indicates whether the query used a regular expression.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryExportedEvent"></a>

### Query Exported

This event is fired when user copies to clipboard the query to export.

**Properties**:

- **language** (optional): `"java" | "javascript" | "csharp" | "python" | "ruby" | "go" | "rust" | "php" | undefined`
  - The language to which the query has been exported.
- **with_import_statements** (optional): `boolean | undefined`
  - Indicates that the query was exported including import statements.
- **with_drivers_syntax** (optional): `boolean | undefined`
  - Indicates that the query was exported including driver syntax.
- **with_builders** (optional): `boolean | undefined`
  - Indicates that the query was exported using builder syntax.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryExportOpenedEvent"></a>

### Query Export Opened

This event is fired when user opens the export to language dialog.

<a name="event--QueryHistoryClosedEvent"></a>

### Query History Closed

This event is fired when user closes query history panel

<a name="event--QueryHistoryFavoriteAddedEvent"></a>

### Query History Favorite Added

This event is fired when user favorites a recent query.

**Properties**:

- **isUpdateQuery** (required): `boolean`
  - Indicates whether the query was an update query.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryHistoryFavoriteCopiedEvent"></a>

### Query History Favorite Copied

This event is fired when user copied query to clipboard.

**Properties**:

- **id** (required): `string`
  - The unique identifier of the query history favorite that was copied.
- **screen** (required): `"my_queries"`
  - The screen from which the query history favorite was copied.

<a name="event--QueryHistoryFavoriteRemovedEvent"></a>

### Query History Favorite Removed

This event is fired when user removes query from favorites.

**Properties**:

- **id** (optional): `string | undefined`
  - The unique identifier of the query history favorite that was removed.
- **screen** (optional): `"my-queries" | "documents" | undefined`
  - The screen from which the query history favorite was removed.
- **isUpdateQuery** (optional): `boolean | undefined`
  - Indicates whether the removed query was an update query.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryHistoryFavoritesEvent"></a>

### Query History Favorites

This event is fired when user selects "favorites" in query history panel.

<a name="event--QueryHistoryFavoriteUsedEvent"></a>

### Query History Favorite Used

This event is fired when user selects a favorite query to put it in the query bar.

**Properties**:

- **id** (optional): `string | undefined`
  - The unique identifier of the query history favorite that was used.
- **screen** (optional): `"my-queries" | "documents" | undefined`
  - The screen from which the query history favorite was loaded.
- **isUpdateQuery** (optional): `boolean | undefined`
  - Indicates whether the loaded query was an update query.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryHistoryOpenedEvent"></a>

### Query History Opened

This event is fired when user opens query history panel.

<a name="event--QueryHistoryRecentEvent"></a>

### Query History Recent

This event is fired when user selects "recent" in query history panel.

<a name="event--QueryHistoryRecentUsedEvent"></a>

### Query History Recent Used

This event is fired when user selects a recent query to put it in the query bar.

**Properties**:

- **isUpdateQuery** (required): `boolean`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--QueryResultsRefreshedEvent"></a>

### Query Results Refreshed

This event is fired when user clicks the refresh button in the UI to refresh
the query results.


## Gen AI

<a name="event--AiPromptSubmittedEvent"></a>

### AI Prompt Submitted

This event is fired when user enters a prompt in the generative AI textbox
and hits "enter".

**Properties**:

- **editor_view_type** (required): `"text" | "stages" | "find"`
  - The type of view used to generate the query.
- **user_input_length** (optional): `number | undefined`
- **request_id** (optional): `string | undefined`
- **has_sample_documents** (optional): `boolean | undefined`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AiQueryFeedbackEvent"></a>

### AI Query Feedback

This event is fired when a user submits feedback for a query generation.

**Properties**:

- **feedback** (required): `"positive" | "negative"`
- **text** (required): `string`
- **request_id** (required): `string | null`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AiResponseFailedEvent"></a>

### AI Response Failed

This event is fired when a query generation request fails with an error.

**Properties**:

- **editor_view_type** (required): `"text" | "stages" | "find"`
  - The type of view used to generate the query.
- **error_code** (optional): `string | undefined`
- **status_code** (optional): `number | undefined`
- **error_name** (optional): `string | undefined`
- **request_id** (optional): `string | undefined`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--AiResponseGeneratedEvent"></a>

### AI Response Generated

This event is fired when AI query or aggregation generated and successfully
rendered in the UI.

**Properties**:

- **editor_view_type** (required): `"text" | "stages" | "find"`
  - The type of view used to generate the query.
- **syntax_errors** (optional): `boolean | undefined`
- **query_shape** (optional): `{} | undefined`
- **request_id** (optional): `string | undefined`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--PipelineAiFeedbackEvent"></a>

### PipelineAI Feedback

This event is fired when a user submits feedback for a pipeline generation.

**Properties**:

- **feedback** (required): `"positive" | "negative"`
  - Wether the feedback was positive or negative.
- **request_id** (required): `string | null`
  - The id of the request related to this feedback. Useful to correlate
feedback to potential error lines in the logs.
- **text** (required): `string`
  - The feedback comment left by the user.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Guide Cues

<a name="event--GuideCueDismissedEvent"></a>

### Guide Cue Dismissed

This event is fired when a user clicks "next" on a guide cue.

**Properties**:

- **groupId** (optional): `string | undefined`
  - The unique identifier of the group of guide cues to which this cue belongs.
This field is only set for guide cues belonging to a group.
- **cueId** (required): `string`
  - The unique identifier of the specific guide cue that was dismissed.
- **step** (required): `number`
  - The step number within the guide cue sequence where the user clicked "next".

<a name="event--GuideCueGroupDismissedEvent"></a>

### Guide Cue Group Dismissed

This event is fired when a user clicks "next" on the last guide cue of a
guide cue group.

**Properties**:

- **groupId** (required): `string`
  - The unique identifier of the group of guide cues that was dismissed.
- **cueId** (required): `string`
  - The unique identifier of the specific guide cue that was the last one in the group.
- **step** (required): `number`
  - The step number within the guide cue sequence where the user clicked "next".


## Import/Export

<a name="event--ExportCompletedEvent"></a>

### Export Completed

This event is fired when a data export completes.

**Properties**:

- **type** (required): `"aggregation" | "query"`
  - The type of query for the completed export. (query = find query).
- **all_docs** (optional): `boolean | undefined`
  - Indicates whether the export was for all documents in the collection.
- **has_projection** (optional): `boolean | undefined`
  - Indicates whether the export query included a projection (a subset of fields).
- **field_option** (optional): `"all-fields" | "select-fields" | undefined`
  - Specifies whether all fields were exported or only selected fields.
- **file_type** (required): `"json" | "csv"`
  - The file type of the exported data, either CSV or JSON.
- **json_format** (optional): `"default" | "relaxed" | "canonical" | undefined`
  - Specifies the format of the JSON file if the file_type is 'json'.
- **field_count** (optional): `number | undefined`
  - For exports with field selection, this is the number of fields that were present
in the list of available fields and that were selected for export.
- **fields_added_count** (optional): `number | undefined`
  - For exports with field selection, this is the number of fields that has been added
manually by the user.
- **fields_not_selected_count** (optional): `number | undefined`
  - For exports with field selection, this is the number of fields that were present
in the list of available fields, but that were not selected for export.
- **number_of_docs** (optional): `number | undefined`
  - The total number of documents exported.
- **success** (required): `boolean`
  - Indicates whether the export operation was successful.
- **stopped** (required): `boolean`
  - Indicates whether the export operation was stopped before completion.
- **duration** (required): `number`
  - The duration of the export operation in milliseconds.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ExportOpenedEvent"></a>

### Export Opened

This event is fired when user opens the export dialog.

**Properties**:

- **type** (required): `"aggregation" | "query"`
  - The type of query for which the export has been open. (query = find query).
- **origin** (required): `"menu" | "crud-toolbar" | "empty-state" | "aggregations-toolbar"`
  - The trigger location for the export.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ImportCompletedEvent"></a>

### Import Completed

This event is fired when a data import completes.

**Properties**:

- **duration** (optional): `number | undefined`
  - The duration of the import operation in milliseconds.
- **delimiter** (optional): `"," | "\t" | ";" | " " | undefined`
  - The delimiter used in the imported file. It could be a comma, tab,
semicolon, or space.
This field is optional and only applicable if the file_type is 'csv'.
- **newline** (optional): `"\r\n" | "\n" | undefined`
  - The newline character(s) used in the imported file.
- **file_type** (optional): `"" | "json" | "csv" | undefined`
  - The type of the imported file, such as CSV or JSON.
- **all_fields** (optional): `boolean | undefined`
  - Indicates whether all fields in the documents were included in the import.
If true, all fields in each document were imported; if false, only
selected fields were imported.
- **stop_on_error_selected** (optional): `boolean | undefined`
  - Indicates whether the "Stop on Error" option was selected during the import.
If true, the import process stops upon encountering an error.
- **number_of_docs** (optional): `number | undefined`
  - The total number of documents imported.
- **success** (optional): `boolean | undefined`
  - Indicates whether the import operation was successful.
- **aborted** (optional): `boolean | undefined`
  - Indicates whether the import operation was aborted before completion.
- **ignore_empty_strings** (optional): `boolean | undefined`
  - Indicates whether empty strings in the imported file were ignored.
If true, fields with empty strings were not included in the imported documents.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ImportErrorLogOpenedEvent"></a>

### Import Error Log Opened

This event is fired when a user clicks the link to open the error log after
receiving import errors.

**Properties**:

- **errorCount** (required): `number`
  - Number of import errors present in the log.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ImportOpenedEvent"></a>

### Import Opened

This event is fired when user opens the import dialog.

**Properties**:

- **origin** (required): `"menu" | "crud-toolbar" | "empty-state"`
  - The trigger location for the import.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Indexes

<a name="event--IndexCreatedEvent"></a>

### Index Created

This event is fired when user creates an index.

**Properties**:

- **unique** (optional): `boolean | undefined`
  - Indicates whether the index is unique.
- **ttl** (optional): `any`
  - Specifies the time-to-live (TTL) setting for the index.
- **columnstore_index** (optional): `boolean | undefined`
  - Indicates whether the index is a columnstore index.
- **has_columnstore_projection** (optional): `any`
  - Indicates if the index has a columnstore projection.
- **has_wildcard_projection** (optional): `any`
  - Indicates if the index includes a wildcard projection.
- **custom_collation** (optional): `any`
  - Specifies if the index uses a custom collation.
- **geo** (optional): `boolean | undefined`
  - Indicates whether the index is a geospatial index.
- **atlas_search** (optional): `boolean | undefined`
  - Indicates whether the index is an Atlas Search index.
- **type** (optional): `string | undefined`
  - Specifies the type of the index.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--IndexCreateFailedEvent"></a>

### Index Create Failed

This event is fired when user creates an index and it fails.

**Properties**:

- **unique** (optional): `boolean | undefined`
  - Indicates whether the index is unique.
- **ttl** (optional): `any`
  - Specifies the time-to-live (TTL) setting for the index.
- **columnstore_index** (optional): `boolean | undefined`
  - Indicates whether the index is a columnstore index.
- **has_columnstore_projection** (optional): `any`
  - Indicates if the index has a columnstore projection.
- **has_wildcard_projection** (optional): `any`
  - Indicates if the index includes a wildcard projection.
- **custom_collation** (optional): `any`
  - Specifies if the index uses a custom collation.
- **geo** (optional): `boolean | undefined`
  - Indicates whether the index is a geospatial index.
- **atlas_search** (optional): `boolean | undefined`
  - Indicates whether the index is an Atlas Search index.
- **type** (optional): `string | undefined`
  - Specifies the type of the index.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--IndexCreateOpenedEvent"></a>

### Index Create Opened

This event is fired when user opens create index dialog.

**Properties**:

- **atlas_search** (optional): `boolean | undefined`
  - Specifies if the index creation dialog open is for an Atlas Search index.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--IndexDroppedEvent"></a>

### Index Dropped

This event is fired when user drops an index.

**Properties**:

- **atlas_search** (optional): `boolean | undefined`
  - Indicates whether the index is an Atlas Search index.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--IndexEditedEvent"></a>

### Index Edited

This event is fired when user updates an index.

**Properties**:

- **atlas_search** (required): `boolean`
  - Indicates whether the index is an Atlas Search index.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## My Queries

<a name="event--MyQueriesFilterEvent"></a>

### My Queries Filter

This event is fired when user filters queries using db / coll filter.

**Properties**:

- **type** (optional): `"database" | "collection" | undefined`
  - The filter that was changed.

<a name="event--MyQueriesSearchEvent"></a>

### My Queries Search

This event is fired when user filters queries using search
input (fires only on input blur).

<a name="event--MyQueriesSortEvent"></a>

### My Queries Sort

This event is fired when user sorts items in the list using one of the
sort options.

**Properties**:

- **sort_by** (required): `"name" | "id" | "type" | "database" | "collection" | "lastModified" | null`
  - The criterion by which the queries are sorted.
- **order** (required): `"ascending" | "descending"`
  - The order of the sorting.


## Other

<a name="event--ApplicationLaunchedEvent"></a>

### Application Launched

This event is fired when the application launch is initiated.

**Properties**:

- **context** (required): `"terminal" | "desktop_app"`
  - The context from which the application was launched.
(NOT whether it is used as a CLI-only tool or not)
- **launch_connection** (required): `"string" | "JSON_file" | "none"`
  - Whether Compass was instructed to automatically connect
to a specific cluster using a connection string on the command line,
a JSON file containing an exported connection on the command line,
or not at all.
- **protected** (optional): `boolean | undefined`
  - Whether the `protectConnectionStrings` preference was set at launch.
- **readOnly** (required): `boolean`
  - Whether the `readOnly` preference was set at launch (including the
compass-readonly distribution).
- **maxTimeMS** (optional): `number | undefined`
  - The value of the `maxTimeMS` preference at launch.
- **global_config** (required): `boolean`
  - Whether any preferences were specified in the global configuration file.
- **cli_args** (required): `boolean`
  - Whether any preferences were specified using CLI arguments.
- **legacy_connections** (required): `boolean`
  - Whether Compass discovered any connections in the legacy connection format
(prior to COMPASS-5490 'Remove storage-mixin' from summer 2023).

<a name="event--AtlasLinkClickedEvent"></a>

### Atlas Link Clicked

This event is fired when a user clicks on the Atlas CTA.

**Properties**:

- **screen** (optional): `"agg_builder" | "connect" | undefined`
  - The screen from which the Atlas CTA was clicked.

<a name="event--ErrorFetchingAttributesEvent"></a>

### Error Fetching Attributes

This event is fired when we fail to track another event due to an exception
while building the attributes.

**Properties**:

- **event_name** (required): `string`
  - The name of the event for which attributes could not be fetched.

<a name="event--KeytarSecretsMigrationFailedEvent"></a>

### Keytar Secrets Migration Failed

This event is fired when the keytar migration fails for a user.
See: https://jira.mongodb.org/browse/COMPASS-6856.

NOTE: Should be removed as part of https://jira.mongodb.org/browse/COMPASS-7948.

**Properties**:

- **num_saved_connections** (required): `number`
  - The number of connections that were successfully saved.
- **num_failed_connections** (required): `number`
  - The number of connections that failed to save during the migration.

<a name="event--PerformanceAdvisorClickedEvent"></a>

### Performance Advisor Clicked

This event is fired when a user clicks on the Performance Advisor CTA.

<a name="event--ScreenEvent"></a>

### Screen

This event is fired when a user activates (i.e., navigates to) a screen.

**Properties**:

- **name** (optional): `"my_queries" | "aggregations" | "documents" | "collections" | "databases" | "indexes" | "globalwrites" | "performance" | "schema" | "validation" | "confirm_new_pipeline_modal" | "create_collection_modal" | "create_database_modal" | "drop_collection_modal" | "drop_database_modal" | "create_index_modal" | "create_search_index_modal" | "create_view_modal" | "csfle_connection_modal" | "delete_pipeline_modal" | "drop_index_modal" | "export_modal" | "export_to_language_modal" | "import_modal" | "insert_document_modal" | "non_genuine_mongodb_modal" | "rename_collection_modal" | "restore_pipeline_modal" | "save_pipeline_modal" | "shell_info_modal" | "update_search_index_modal" | undefined`
  - The name of the screen that was activated.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--SecretStorageNotAvailable"></a>

### Secret Storage Not Available

This event is fired at startup when we detect that the application is running on
a system that doesn't offer a suitable secret storage backend.


## Performance Tab

<a name="event--CurrentOpShowOperationDetailsEvent"></a>

### CurrentOp showOperationDetails

This event is fired when a user clicks to show the details of an operation.

<a name="event--DetailViewHideOperationDetailsEvent"></a>

### DetailView hideOperationDetails

This event is fired when a user clicks to hide the details of an operation.

<a name="event--DetailViewKillOpEvent"></a>

### DetailView killOp

This event is fired when a user clicks to kill an operation.

<a name="event--PerformancePausedEvent"></a>

### Performance Paused

This event is fired when a user pauses the performance screen.

<a name="event--PerformanceResumedEvent"></a>

### Performance Resumed

This event is fired when a user resumes a paused performance screen.


## Proactive Performance Insights

<a name="event--SignalActionButtonClickedEvent"></a>

### Signal Action Button Clicked

This event is fired when Action button for the signal is clicked inside the popup.

**Properties**:

- **id** (required): `string`
  - A unique identifier for the type of the signal.

<a name="event--SignalClosedEvent"></a>

### Signal Closed

This event is fired when user clicked the close button or outside the signal and closed the popup.

**Properties**:

- **id** (required): `string`
  - A unique identifier for the type of the signal.

<a name="event--SignalLinkClickedEvent"></a>

### Signal Link Clicked

This event is fired when "Learn more" link is clicked inside the signal popup.

**Properties**:

- **id** (required): `string`
  - A unique identifier for the type of the signal.

<a name="event--SignalOpenedEvent"></a>

### Signal Opened

This event is fired when signal badge is clicked and popup is opened.

**Properties**:

- **id** (required): `string`
  - A unique identifier for the type of the signal.

<a name="event--SignalShownEvent"></a>

### Signal Shown

This event is fired when signal icon badge is rendered on the screen visible to the user.

**Properties**:

- **id** (required): `string`
  - A unique identifier for the type of the signal.


## Schema

<a name="event--SchemaAnalyzedEvent"></a>

### Schema Analyzed

This event is fired when user analyzes the schema.

**Properties**:

- **with_filter** (required): `boolean`
  - Indicates whether a filter was applied during the schema analysis.
- **schema_width** (required): `number`
  - The number of fields at the top level.
- **schema_depth** (required): `number`
  - The number of nested levels.
- **geo_data** (required): `boolean`
  - Indicates whether the schema contains geospatial data.
- **analysis_time_ms** (required): `number`
  - The time taken to analyze the schema, in milliseconds.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--SchemaExportedEvent"></a>

### Schema Exported

This event is fired when user shares the schema.

**Properties**:

- **has_schema** (required): `boolean`
  - Indicates whether the schema was analyzed before sharing.
- **schema_width** (required): `number`
  - The number of fields at the top level.
- **schema_depth** (required): `number`
  - The number of nested levels.
- **geo_data** (required): `boolean`
  - Indicates whether the schema contains geospatial data.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Schema Validation

<a name="event--SchemaValidationAddedEvent"></a>

### Schema Validation Added

This event is fired when user adds validation rules.

<a name="event--SchemaValidationEditedEvent"></a>

### Schema Validation Edited

This event is fired when user edits validation rules (without saving them).

**Properties**:

- **json_schema** (required): `boolean`
  - Indicates wether the validation rule uses $jsonSchema.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--SchemaValidationUpdatedEvent"></a>

### Schema Validation Updated

This event is fired when user saves validation rules.

**Properties**:

- **validation_action** (required): `"error" | "warn"`
  - The validation action passed to the driver.
- **validation_level** (required): `"off" | "moderate" | "strict"`
  - The level of schema validation passed to the driver.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Settings

<a name="event--ThemeChangedEvent"></a>

### Theme Changed

This event is fired when a user changes the theme.

**Properties**:

- **theme** (required): `"DARK" | "LIGHT" | "OS_THEME"`
  - The theme selected by the user. It can be 'DARK', 'LIGHT', or 'OS_THEME'.


## Shell

<a name="event--OpenShellEvent"></a>

### Open Shell

This event is fired when the shell is open

**Properties**:

- **entrypoint** (optional): `string | undefined`
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.

<a name="event--ShellEvent"></a>

### `Shell ${string}`

This is a group of events forwarded from the embedded shell.
Every event from the shell is forwarded adding the "Shell " prefix to the original
event name.

Note: each forwarded event is exposing a different set of properties in
addition to the `mongosh_version` and `session_id`. Refer to the mongosh
tracking plan for details about single events.

**Properties**:

- **mongosh_version** (required): `string`
  - The version of the embedded mongosh package.
- **session_id** (required): `string`
  - The shell session_id.
- **connection_id** (optional): `string | undefined`
  - The id of the connection associated to this event.


## Web Vitals

<a name="event--FirstContentfulPaintEvent"></a>

### First Contentful Paint

This event is fired at startup to report the First Contentful Paint metric.
See: https://web.dev/articles/vitals.

**Properties**:

- **value** (required): `number`
  - The reported metric value.

<a name="event--LargestContentfulPaintEvent"></a>

### Largest Contentful Paint

This event is fired at startup to report the Largest Contentful Paint metric.
See: https://web.dev/articles/vitals.

**Properties**:

- **value** (required): `number`
  - The reported metric value.

<a name="event--FirstInputDelayEvent"></a>

### First Input Delay

This event is fired at startup to report the First Input Delay metric.
See: https://web.dev/articles/vitals.

**Properties**:

- **value** (required): `number`
  - The reported metric value.

<a name="event--CumulativeLayoutShiftEvent"></a>

### Cumulative Layout Shift

This event is fired at startup to report the Cumulative Layout Shift metric.
See: https://web.dev/articles/vitals.

**Properties**:

- **value** (required): `number`
  - The reported metric value.

<a name="event--TimeToFirstByteEvent"></a>

### Time to First Byte

This event is fired at startup to report the Time to First Byte metric.
See: https://web.dev/articles/vitals.

**Properties**:

- **value** (required): `number`
  - The reported metric value.




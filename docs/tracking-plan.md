# Compass Tracking Plan

> Auto-generated on 2026-07-13. Do not edit manually.
> Run `npm run generate-tracking-plan` to regenerate from source.

## Table of Contents

- [Common Properties](#common-properties)
- [Aggregation Builder](#aggregation-builder)
  - [Aggregation Canceled](#aggregation-canceled)
  - [Aggregation Copied](#aggregation-copied)
  - [Aggregation Deleted](#aggregation-deleted)
  - [Aggregation Edited](#aggregation-edited)
  - [Aggregation Executed](#aggregation-executed)
  - [Aggregation Explained](#aggregation-explained)
  - [Aggregation Exported](#aggregation-exported)
  - [Aggregation Export Opened](#aggregation-export-opened)
  - [Aggregation Opened](#aggregation-opened)
  - [Aggregation Saved As View](#aggregation-saved-as-view)
  - [Aggregation Saved](#aggregation-saved)
  - [Aggregation Side Panel Opened](#aggregation-side-panel-opened)
  - [Aggregation Timed Out](#aggregation-timed-out)
  - [Aggregation Use Case Added](#aggregation-use-case-added)
  - [Aggregation Use Case Saved](#aggregation-use-case-saved)
  - [Editor Type Changed](#editor-type-changed)
  - [Focus Mode Closed](#focus-mode-closed)
  - [Focus Mode Opened](#focus-mode-opened)
  - [View Updated](#view-updated)
  - [Rerank Not Enabled Banner Shown](#rerank-not-enabled-banner-shown)
  - [Rerank Version Warning Banner Shown](#rerank-version-warning-banner-shown)
  - [Rerank First Stage Banner Dismissed](#rerank-first-stage-banner-dismissed)
  - [Rerank First Stage Banner Learn More Clicked](#rerank-first-stage-banner-learn-more-clicked)
  - [Rerank Add Search Stage Button Clicked](#rerank-add-search-stage-button-clicked)
  - [Rerank Learn About Search Button Clicked](#rerank-learn-about-search-button-clicked)
  - [Rerank Tell Me More Button Clicked](#rerank-tell-me-more-button-clicked)
  - [Rerank Upgrade Cluster Button Clicked](#rerank-upgrade-cluster-button-clicked)
  - [Rerank Project Settings Button Clicked](#rerank-project-settings-button-clicked)
  - [Rerank View Usage And Rate Limits Link Clicked](#rerank-view-usage-and-rate-limits-link-clicked)
  - [Search Extension Rate Limit Banner Shown](#search-extension-rate-limit-banner-shown)
  - [Search Extension Rate Limit Billing Link Clicked](#search-extension-rate-limit-billing-link-clicked)
  - [Search Extension Rate Limit Page Link Clicked](#search-extension-rate-limit-page-link-clicked)
- [Application](#application)
  - [Render Process Gone](#render-process-gone)
- [Assistant](#assistant)
  - [Assistant Prompt Submitted](#assistant-prompt-submitted)
  - [Assistant Response Failed](#assistant-response-failed)
  - [Assistant Failed](#assistant-failed)
  - [Assistant Feedback Submitted](#assistant-feedback-submitted)
  - [Assistant Entry Point Used](#assistant-entry-point-used)
  - [Assistant Confirmation Submitted](#assistant-confirmation-submitted)
  - [Assistant Response Generated](#assistant-response-generated)
- [Atlas](#atlas)
  - [Atlas Sign In Error](#atlas-sign-in-error)
  - [Atlas Sign In Success](#atlas-sign-in-success)
  - [Atlas Sign Out](#atlas-sign-out)
- [Auto-updates](#auto-updates)
  - [Autoupdate Accepted](#autoupdate-accepted)
  - [Autoupdate Dismissed](#autoupdate-dismissed)
  - [Application Restart Accepted](#application-restart-accepted)
  - [Autoupdate Enabled](#autoupdate-enabled)
  - [Autoupdate Disabled](#autoupdate-disabled)
- [Bulk Operations](#bulk-operations)
  - [Bulk Delete Executed](#bulk-delete-executed)
  - [Bulk Delete Opened](#bulk-delete-opened)
  - [Bulk Update Executed](#bulk-update-executed)
  - [Bulk Update Favorited](#bulk-update-favorited)
  - [Bulk Update Opened](#bulk-update-opened)
  - [Delete Exported](#delete-exported)
  - [Delete Export Opened](#delete-export-opened)
  - [Update Exported](#update-exported)
  - [Update Export Opened](#update-export-opened)
- [Connection](#connection)
  - [Connection Attempt](#connection-attempt)
  - [Connection Created](#connection-created)
  - [Connection Disconnected](#connection-disconnected)
  - [Connection Exported](#connection-exported)
  - [Connection Failed](#connection-failed)
  - [Connection Imported](#connection-imported)
  - [Connection Removed](#connection-removed)
  - [New Connection](#new-connection)
- [Context Menu](#context-menu)
  - [Context Menu Opened](#context-menu-opened)
  - [Context Menu Item Clicked](#context-menu-item-clicked)
- [Data Modeling](#data-modeling)
  - [Data Modeling Collection Added](#data-modeling-collection-added)
  - [Data Modeling Collection Removed](#data-modeling-collection-removed)
  - [Data Modeling Collection Renamed](#data-modeling-collection-renamed)
  - [Data Modeling Create Diagram Modal Opened](#data-modeling-create-diagram-modal-opened)
  - [Data Modeling Diagram Creation Started](#data-modeling-diagram-creation-started)
  - [Data Modeling Diagram Creation Relationship Inferral Started](#data-modeling-diagram-creation-relationship-inferral-started)
  - [Data Modeling Diagram Created](#data-modeling-diagram-created)
  - [Data Modeling Diagram Creation Cancelled](#data-modeling-diagram-creation-cancelled)
  - [Data Modeling Diagram Creation Failed](#data-modeling-diagram-creation-failed)
  - [Data Modeling Add DB Collections Modal Opened](#data-modeling-add-db-collections-modal-opened)
  - [Data Modeling Add DB Collections Started](#data-modeling-add-db-collections-started)
  - [Data Modeling Add DB Collections Succeeded](#data-modeling-add-db-collections-succeeded)
  - [Data Modeling Add DB Collections Failed](#data-modeling-add-db-collections-failed)
  - [Data Modeling Add DB Collections Cancelled](#data-modeling-add-db-collections-cancelled)
  - [Data Modeling Diagram Exported](#data-modeling-diagram-exported)
  - [Data Modeling Field Added](#data-modeling-field-added)
  - [Data Modeling Field Removed](#data-modeling-field-removed)
  - [Data Modeling Field Renamed](#data-modeling-field-renamed)
  - [Data Modeling Field Type Changed](#data-modeling-field-type-changed)
  - [Data Modeling Diagram Imported](#data-modeling-diagram-imported)
  - [Data Modeling Relationship Added](#data-modeling-relationship-added)
  - [Data Modeling Relationship Form Opened](#data-modeling-relationship-form-opened)
  - [Data Modeling Relationship Deleted](#data-modeling-relationship-deleted)
- [Database / Collection List](#database-collection-list)
  - [Collection Created](#collection-created)
  - [Database Created](#database-created)
  - [Switch View Type](#switch-view-type)
- [Documents](#documents)
  - [Document Cloned](#document-cloned)
  - [Document Copied](#document-copied)
  - [Document Deleted](#document-deleted)
  - [Document Inserted](#document-inserted)
  - [Document Updated](#document-updated)
- [Drawer](#drawer)
  - [Drawer Section Opened](#drawer-section-opened)
  - [Drawer Section Closed](#drawer-section-closed)
- [Explain](#explain)
  - [Explain Plan Executed](#explain-plan-executed)
- [Find Queries](#find-queries)
  - [Query Edited](#query-edited)
  - [Query Reset Clicked](#query-reset-clicked)
  - [Query Executed](#query-executed)
  - [Query Exported](#query-exported)
  - [Query Export Opened](#query-export-opened)
  - [Query History Closed](#query-history-closed)
  - [Query History Favorite Added](#query-history-favorite-added)
  - [Query History Favorite Copied](#query-history-favorite-copied)
  - [Query History Favorite Removed](#query-history-favorite-removed)
  - [Query History Favorites](#query-history-favorites)
  - [Query History Favorite Used](#query-history-favorite-used)
  - [Query History Opened](#query-history-opened)
  - [Query History Recent](#query-history-recent)
  - [Query History Recent Used](#query-history-recent-used)
  - [Query Results Refreshed](#query-results-refreshed)
- [Gen AI](#gen-ai)
  - [AI Opt In Modal Shown](#ai-opt-in-modal-shown)
  - [AI Opt In Modal Dismissed](#ai-opt-in-modal-dismissed)
  - [AI Generate Query Clicked](#ai-generate-query-clicked)
  - [AI Prompt Submitted](#ai-prompt-submitted)
  - [AI Query Feedback](#ai-query-feedback)
  - [AI Response Failed](#ai-response-failed)
  - [AI Response Generated](#ai-response-generated)
  - [PipelineAI Feedback](#pipelineai-feedback)
- [Guide Cues](#guide-cues)
  - [Guide Cue Dismissed](#guide-cue-dismissed)
  - [Guide Cue Group Dismissed](#guide-cue-group-dismissed)
- [Identify](#identify)
  - [Identify](#identify)
- [Import/Export](#importexport)
  - [Export Completed](#export-completed)
  - [Export Opened](#export-opened)
  - [Import Completed](#import-completed)
  - [Import Error Log Opened](#import-error-log-opened)
  - [Import Opened](#import-opened)
- [Indexes](#indexes)
  - [Atlas Search Indexes for View Link Clicked](#atlas-search-indexes-for-view-link-clicked)
  - [Create Search Index for View Clicked](#create-search-index-for-view-clicked)
  - [Index Created](#index-created)
  - [Index Create Failed](#index-create-failed)
  - [Index Create Opened](#index-create-opened)
  - [Index Dropped](#index-dropped)
  - [Index Edited](#index-edited)
  - [Index Create Action Clicked](#index-create-action-clicked)
  - [Index Edit Action Clicked](#index-edit-action-clicked)
  - [Index Drop Action Clicked](#index-drop-action-clicked)
  - [Index Refresh Clicked](#index-refresh-clicked)
  - [Manage Search Indexes Link Clicked](#manage-search-indexes-link-clicked)
- [Mock Data Generator](#mock-data-generator)
  - [Mock Data Generator CTA Button Viewed](#mock-data-generator-cta-button-viewed)
  - [Mock Data Generator Opened](#mock-data-generator-opened)
  - [Mock Data Generator Screen Viewed](#mock-data-generator-screen-viewed)
  - [Mock Data Generator Screen Proceeded](#mock-data-generator-screen-proceeded)
  - [Mock Data Generator Dismissed](#mock-data-generator-dismissed)
  - [Mock Data Document Count Changed](#mock-data-document-count-changed)
  - [Mock Data Script Generated](#mock-data-script-generated)
  - [Mock Data Script Copied](#mock-data-script-copied)
- [My Queries](#my-queries)
  - [My Queries Filter](#my-queries-filter)
  - [My Queries Search](#my-queries-search)
  - [My Queries Sort](#my-queries-sort)
- [Other](#other)
  - [Application Launched](#application-launched)
  - [Atlas Link Clicked](#atlas-link-clicked)
  - [Error Fetching Attributes](#error-fetching-attributes)
  - [Performance Advisor Clicked](#performance-advisor-clicked)
  - [Assistant Tool Call Approval](#assistant-tool-call-approval)
  - [Screen](#screen)
  - [Secret Storage Not Available](#secret-storage-not-available)
  - [Experiment Viewed](#experiment-viewed)
  - [Create Index Button Clicked](#create-index-button-clicked)
  - [Cancel Button Clicked](#cancel-button-clicked)
  - [Create Index Modal Closed](#create-index-modal-closed)
  - [New Index Field Added](#new-index-field-added)
  - [Options Clicked](#options-clicked)
  - [UUID Encountered](#uuid-encountered)
- [Performance Tab](#performance-tab)
  - [CurrentOp showOperationDetails](#currentop-showoperationdetails)
  - [DetailView hideOperationDetails](#detailview-hideoperationdetails)
  - [DetailView killOp](#detailview-killop)
  - [Performance Paused](#performance-paused)
  - [Performance Resumed](#performance-resumed)
- [Proactive Performance Insights](#proactive-performance-insights)
  - [Signal Action Button Clicked](#signal-action-button-clicked)
  - [Signal Closed](#signal-closed)
  - [Signal Link Clicked](#signal-link-clicked)
  - [Signal Opened](#signal-opened)
  - [Signal Shown](#signal-shown)
- [Schema](#schema)
  - [Schema Analysis Started](#schema-analysis-started)
  - [Schema Analysis Failed](#schema-analysis-failed)
  - [Schema Analysis Cancelled](#schema-analysis-cancelled)
  - [Schema Analyzed](#schema-analyzed)
  - [Schema Exported](#schema-exported)
  - [Schema Export Failed](#schema-export-failed)
- [Schema Validation](#schema-validation)
  - [Schema Validation Added](#schema-validation-added)
  - [Schema Validation Edited](#schema-validation-edited)
  - [Schema Validation Updated](#schema-validation-updated)
  - [Schema Validation Generated](#schema-validation-generated)
- [Search Indexes](#search-indexes)
  - [Search Index Edit Link Clicked](#search-index-edit-link-clicked)
  - [Search Index View Indexes Link Clicked](#search-index-view-indexes-link-clicked)
  - [Search Index Create Link Clicked](#search-index-create-link-clicked)
  - [Search Index View Definition Link Clicked](#search-index-view-definition-link-clicked)
  - [Search Index View Indexes Button Clicked](#search-index-view-indexes-button-clicked)
  - [Search Index Create Submitted](#search-index-create-submitted)
  - [Search Index Create Cancelled](#search-index-create-cancelled)
  - [Search Index Edit Submitted](#search-index-edit-submitted)
  - [Search Index Edit Cancelled](#search-index-edit-cancelled)
  - [Search Index Status Details Link Clicked](#search-index-status-details-link-clicked)
- [Settings](#settings)
  - [Setting Changed](#setting-changed)
  - [Theme Changed](#theme-changed)
- [Shell](#shell)
  - [Open Shell](#open-shell)
  - [`Shell ${string}`](#shell-string)
- [Web Vitals](#web-vitals)
  - [First Contentful Paint](#first-contentful-paint)
  - [Largest Contentful Paint](#largest-contentful-paint)
  - [First Input Delay](#first-input-delay)
  - [Cumulative Layout Shift](#cumulative-layout-shift)
  - [Time to First Byte](#time-to-first-byte)

## Common Properties

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `is_compass_web` | `true \| undefined` | No       |             |

## Aggregation Builder

### Aggregation Canceled

This event is fired when a user cancel a running aggregation.

_No additional properties._

### Aggregation Copied

This event is fired when user copied the pipeline to clipboard.

| Property         | Type                | Required | Description                                            |
| ---------------- | ------------------- | -------- | ------------------------------------------------------ |
| `id`             | `string`            | Yes      | A unique id for the aggregation object being copied.   |
| `screen`         | `"my-queries"`      | Yes      | The screen from which the aggregation has been copied. |
| `is_compass_web` | `true \| undefined` | No       |                                                        |

### Aggregation Deleted

This event is fired when user deletes a previously saved aggregation pipeline.

| Property           | Type                                          | Required | Description                                                          |
| ------------------ | --------------------------------------------- | -------- | -------------------------------------------------------------------- |
| `id`               | `string \| undefined`                         | No       | A unique id for the aggregation object being deleted.                |
| `editor_view_type` | `"stage" \| "text" \| "focus" \| undefined`   | No       | The type of editor view from which the aggregation has been deleted. |
| `screen`           | `"my_queries" \| "aggregations" \| undefined` | No       | The screen from which the aggregation has been deleted.              |
| `is_compass_web`   | `true \| undefined`                           | No       |                                                                      |
| `connection_id`    | `string \| undefined`                         | No       | The id of the connection associated to this event.                   |

### Aggregation Edited

This event is fired when user adds/remove a stage or changes the stage name
in the stage editor view.

| Property           | Type                                                                                                               | Required | Description                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`       | `number \| undefined`                                                                                              | No       | The number of stages present in the aggregation at the moment when the even has been fired. |
| `editor_view_type` | `"stage" \| "text" \| "focus" \| undefined`                                                                        | No       | The type of view used to edit the aggregation.                                              |
| `stage_index`      | `number \| undefined`                                                                                              | No       | The index of the stage being edited.                                                        |
| `stage_action`     | `"stage_content_changed" \| "stage_renamed" \| "stage_added" \| "stage_deleted" \| "stage_reordered" \| undefined` | No       | The edit action being performed for stage and focus mode.                                   |
| `stage_name`       | `string \| null \| undefined`                                                                                      | No       | The name of the stage edited.                                                               |
| `is_compass_web`   | `true \| undefined`                                                                                                | No       |                                                                                             |
| `connection_id`    | `string \| undefined`                                                                                              | No       | The id of the connection associated to this event.                                          |

### Aggregation Executed

This event is fired when user runs the aggregation.

| Property           | Type                           | Required | Description                                                                                 |
| ------------------ | ------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`       | `number`                       | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `editor_view_type` | `"stage" \| "text" \| "focus"` | Yes      | The type of editor view from which the aggregation has been executed.                       |
| `stage_operators`  | `{}`                           | Yes      | The names of the stages in the pipeline being executed.                                     |
| `is_compass_web`   | `true \| undefined`            | No       |                                                                                             |
| `connection_id`    | `string \| undefined`          | No       | The id of the connection associated to this event.                                          |

### Aggregation Explained

This event is fired when user runs the explain plan for an aggregation.

| Property         | Type                  | Required | Description                                                                                 |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`     | `number`              | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `index_used`     | `boolean`             | Yes      | Wether the explain reports that an index was used by the query.                             |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                             |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                          |

### Aggregation Exported

This event is fired when user copies to clipboard the aggregation to export.

| Property                 | Type                                                                                               | Required | Description                                                                                 |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`             | `number \| undefined`                                                                              | No       | The number of stages present in the aggregation at the moment when the even has been fired. |
| `language`               | `"java" \| "javascript" \| "csharp" \| "python" \| "ruby" \| "go" \| "rust" \| "php" \| undefined` | No       | The language to which the query has been exported.                                          |
| `with_import_statements` | `boolean \| undefined`                                                                             | No       | Indicates that the query was exported including import statements.                          |
| `with_drivers_syntax`    | `boolean \| undefined`                                                                             | No       | Indicates that the query was exported including driver syntax.                              |
| `with_builders`          | `boolean \| undefined`                                                                             | No       | Indicates that the query was exported using builder syntax.                                 |
| `is_compass_web`         | `true \| undefined`                                                                                | No       |                                                                                             |
| `connection_id`          | `string \| undefined`                                                                              | No       | The id of the connection associated to this event.                                          |

### Aggregation Export Opened

This event is fired when user opens the export to language dialog.

| Property         | Type                  | Required | Description                                                                                 |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`     | `number \| undefined` | No       | The number of stages present in the aggregation at the moment when the even has been fired. |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                             |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                          |

### Aggregation Opened

This event is fired when user opens a previously saved aggregation pipeline.

| Property           | Type                                          | Required | Description                                                         |
| ------------------ | --------------------------------------------- | -------- | ------------------------------------------------------------------- |
| `id`               | `string \| undefined`                         | No       | A unique id for the aggregation object being opened.                |
| `editor_view_type` | `"stage" \| "text" \| "focus" \| undefined`   | No       | The type of editor view from which the aggregation is being opened. |
| `screen`           | `"my_queries" \| "aggregations" \| undefined` | No       | The screen from which the aggregation is being opened.              |
| `is_compass_web`   | `true \| undefined`                           | No       |                                                                     |
| `connection_id`    | `string \| undefined`                         | No       | The id of the connection associated to this event.                  |

### Aggregation Saved As View

This event is fired when user saves aggregation pipeline as a view

| Property         | Type                  | Required | Description                                                                                 |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`     | `number`              | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                             |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                          |

### Aggregation Saved

This event is fired when user saves aggregation pipeline.

| Property           | Type                           | Required | Description                                                                                 |
| ------------------ | ------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `id`               | `string`                       | Yes      | A unique id for the aggregation object being saved.                                         |
| `num_stages`       | `number \| undefined`          | No       | The number of stages present in the aggregation at the moment when the even has been fired. |
| `editor_view_type` | `"stage" \| "text" \| "focus"` | Yes      | The type of editor view from which the aggregation is being saved.                          |
| `is_compass_web`   | `true \| undefined`            | No       |                                                                                             |
| `connection_id`    | `string \| undefined`          | No       | The id of the connection associated to this event.                                          |

### Aggregation Side Panel Opened

This event is fired when user clicks the aggregation side panel button.

| Property         | Type                  | Required | Description                                                                                 |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`     | `number`              | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                             |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                          |

### Aggregation Timed Out

This event is fired when an aggregation times out

| Property         | Type                  | Required | Description                                           |
| ---------------- | --------------------- | -------- | ----------------------------------------------------- |
| `max_time_ms`    | `number \| null`      | Yes      | The max_time_ms setting of the aggregation timed out. |
| `is_compass_web` | `true \| undefined`   | No       |                                                       |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.    |

### Aggregation Use Case Added

This event is fired when user selects a use case from the aggregation panel.

| Property         | Type                   | Required | Description                                            |
| ---------------- | ---------------------- | -------- | ------------------------------------------------------ |
| `drag_and_drop`  | `boolean \| undefined` | No       | Specifies if the use case was added via drag and drop. |
| `stage_name`     | `string \| undefined`  | No       | The name of the stage added.                           |
| `is_compass_web` | `true \| undefined`    | No       |                                                        |
| `connection_id`  | `string \| undefined`  | No       | The id of the connection associated to this event.     |

### Aggregation Use Case Saved

This event is fired when users saves a completed use case form, adding
the stage to their pipeline.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `stage_name`     | `string \| null`      | Yes      | The name of the stage the use case refers to.      |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Editor Type Changed

This event is fired when user changes editor type.

| Property           | Type                           | Required | Description                                                                                 |
| ------------------ | ------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`       | `number`                       | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `editor_view_type` | `"stage" \| "text" \| "focus"` | Yes      | The new type of view that editor was changed to.                                            |
| `is_compass_web`   | `true \| undefined`            | No       |                                                                                             |
| `connection_id`    | `string \| undefined`          | No       | The id of the connection associated to this event.                                          |

### Focus Mode Closed

This event is fired when user clicks to minimize focus mode.

| Property         | Type                  | Required | Description                                                                                 |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`     | `number`              | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `duration`       | `number`              | Yes      | Time elapsed between the focus mode has been opened and then closed (in milliseconds).      |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                             |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                          |

### Focus Mode Opened

This event is fired when user clicks to expand focus mode.

| Property         | Type                  | Required | Description                                                                                 |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`     | `number`              | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                             |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                          |

### View Updated

This event is fired when user updates a collection view they had opened in the agg
builder.

| Property           | Type                           | Required | Description                                                                                 |
| ------------------ | ------------------------------ | -------- | ------------------------------------------------------------------------------------------- |
| `num_stages`       | `number`                       | Yes      | The number of stages present in the aggregation at the moment when the even has been fired. |
| `editor_view_type` | `"stage" \| "text" \| "focus"` | Yes      | The type of editor view from which the view has been updated.                               |
| `is_compass_web`   | `true \| undefined`            | No       |                                                                                             |
| `connection_id`    | `string \| undefined`          | No       | The id of the connection associated to this event.                                          |

### Rerank Not Enabled Banner Shown

This event is fired when the "rerank not enabled" server error banner is
shown to the user in the pipeline results workspace.

| Property         | Type                     | Required | Description                                         |
| ---------------- | ------------------------ | -------- | --------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the banner was shown. |
| `is_compass_web` | `true \| undefined`      | No       |                                                     |

### Rerank Version Warning Banner Shown

This event is fired when the rerank server version warning banner is shown
to the user, indicating the cluster must be upgraded to use $rerank.

| Property         | Type                     | Required | Description                                         |
| ---------------- | ------------------------ | -------- | --------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the banner was shown. |
| `is_compass_web` | `true \| undefined`      | No       |                                                     |

### Rerank First Stage Banner Dismissed

This event is fired when the user dismisses the $rerank first-stage
insight banner.

| Property         | Type                     | Required | Description                                             |
| ---------------- | ------------------------ | -------- | ------------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the banner was dismissed. |
| `is_compass_web` | `true \| undefined`      | No       |                                                         |

### Rerank First Stage Banner Learn More Clicked

This event is fired when the user clicks the "Learn more" button in the
$rerank first-stage insight banner.

| Property         | Type                     | Required | Description                                           |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`      | No       |                                                       |

### Rerank Add Search Stage Button Clicked

This event is fired when the user clicks the "Add $search stage" button
in the $rerank insight popover.

| Property         | Type                     | Required | Description                                           |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`      | No       |                                                       |

### Rerank Learn About Search Button Clicked

This event is fired when the user clicks the "Learn about search" button
in the $rerank insight popover.

| Property         | Type                     | Required | Description                                           |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`      | No       |                                                       |

### Rerank Tell Me More Button Clicked

This event is fired when the user clicks the "Tell me more" assistant
button in the $rerank insight popover.

| Property         | Type                     | Required | Description                                           |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`      | No       |                                                       |

### Rerank Upgrade Cluster Button Clicked

This event is fired when the user clicks the "Upgrade Cluster" button in
the rerank version warning banner.

| Property         | Type                     | Required | Description                                           |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`      | No       |                                                       |

### Rerank Project Settings Button Clicked

This event is fired when the user clicks the "Project Settings" button in
the rerank not enabled banner.

| Property         | Type                     | Required | Description                                           |
| ---------------- | ------------------------ | -------- | ----------------------------------------------------- |
| `context`        | `RerankTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`      | No       |                                                       |

### Rerank View Usage And Rate Limits Link Clicked

This event is fired when the user clicks the "View $rerank Usage and Rate
Limits" link in the stage toolbar or focus mode header.

| Property         | Type                     | Required | Description |
| ---------------- | ------------------------ | -------- | ----------- |
| `context`        | `RerankTelemetryContext` | Yes      |             |
| `is_compass_web` | `true \| undefined`      | No       |             |

### Search Extension Rate Limit Banner Shown

This event is fired when the search extension rate limit exceeded banner
is shown to the user.

| Property                | Type                                   | Required | Description                                              |
| ----------------------- | -------------------------------------- | -------- | -------------------------------------------------------- |
| `context`               | `"Search Extension Rate Limit Banner"` | Yes      | The context/screen from which the banner was shown.      |
| `search_extension_type` | `string \| null`                       | Yes      | The search extension type that triggered the rate limit. |
| `rate_limit_type`       | `"billing" \| "rpm" \| "tpm"`          | Yes      | The type of rate limit that was exceeded.                |
| `is_compass_web`        | `true \| undefined`                    | No       |                                                          |

### Search Extension Rate Limit Billing Link Clicked

This event is fired when the user clicks the billing link in the search
extension rate limit banner.

| Property                | Type                                   | Required | Description                                              |
| ----------------------- | -------------------------------------- | -------- | -------------------------------------------------------- |
| `context`               | `"Search Extension Rate Limit Banner"` | Yes      | The context/screen from which the link was clicked.      |
| `search_extension_type` | `string \| null`                       | Yes      | The search extension type that triggered the rate limit. |
| `is_compass_web`        | `true \| undefined`                    | No       |                                                          |

### Search Extension Rate Limit Page Link Clicked

This event is fired when the user clicks the "View Rate Limit" link in the
search extension rate limit banner.

| Property                | Type                                   | Required | Description                                                         |
| ----------------------- | -------------------------------------- | -------- | ------------------------------------------------------------------- |
| `context`               | `"Search Extension Rate Limit Banner"` | Yes      | The context/screen from which the link was clicked.                 |
| `search_extension_type` | `string \| null`                       | Yes      | The search extension type that triggered the rate limit.            |
| `rate_limit_type`       | `"rpm" \| "tpm"`                       | Yes      | Whether the rate limit is requests-per-minute or tokens-per-minute. |
| `is_compass_web`        | `true \| undefined`                    | No       |                                                                     |

## Application

### Render Process Gone

This event is fired from the main process when a renderer process
terminates unexpectedly (crash, OOM, killed, etc.).
Normal clean exits are excluded.

| Property         | Type                                                                                                               | Required | Description                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------ |
| `reason`         | `"abnormal-exit" \| "killed" \| "crashed" \| "oom" \| "launch-failed" \| "integrity-failure" \| "memory-eviction"` | Yes      | The reason the renderer process terminated.                                                                  |
| `exit_code`      | `number`                                                                                                           | Yes      | The exit code of the process, or a platform-specific launch failure error code if reason is 'launch-failed'. |
| `is_compass_web` | `true \| undefined`                                                                                                | No       |                                                                                                              |

## Assistant

### Assistant Prompt Submitted

This event is fired when user enters a prompt in the assistant chat
and hits "enter".

| Property            | Type                  | Required | Description                                        |
| ------------------- | --------------------- | -------- | -------------------------------------------------- |
| `user_input_length` | `number \| undefined` | No       |                                                    |
| `request_id`        | `string \| undefined` | No       |                                                    |
| `is_compass_web`    | `true \| undefined`   | No       |                                                    |
| `connection_id`     | `string \| undefined` | No       | The id of the connection associated to this event. |

### Assistant Response Failed

This event is fired when the AI response encounters an error.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `error_name`     | `string \| undefined` | No       |                                                    |
| `request_id`     | `string \| undefined` | No       |                                                    |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Assistant Failed

This event is fired when the AI fails due to any error.

| Property         | Type                  | Required | Description |
| ---------------- | --------------------- | -------- | ----------- |
| `error_name`     | `string \| undefined` | No       |             |
| `is_compass_web` | `true \| undefined`   | No       |             |

### Assistant Feedback Submitted

This event is fired when a user submits feedback for the assistant.

| Property         | Type                                                                                                                                                                             | Required | Description                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `feedback`       | `"positive" \| "negative"`                                                                                                                                                       | Yes      |                                                    |
| `text`           | `string \| undefined`                                                                                                                                                            | No       |                                                    |
| `request_id`     | `string \| undefined`                                                                                                                                                            | No       |                                                    |
| `source`         | `"explain plan" \| "performance insights" \| "connection error" \| "follow-up prompt" \| "analyze output" \| "search stage error" \| "search stage diagnose" \| "chat response"` | Yes      |                                                    |
| `is_compass_web` | `true \| undefined`                                                                                                                                                              | No       |                                                    |
| `connection_id`  | `string \| undefined`                                                                                                                                                            | No       | The id of the connection associated to this event. |

### Assistant Entry Point Used

This event is fired when a user uses an assistant entry point.

| Property         | Type                                                                                                                                                          | Required | Description                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `source`         | `"explain plan" \| "performance insights" \| "connection error" \| "follow-up prompt" \| "analyze output" \| "search stage error" \| "search stage diagnose"` | Yes      |                                                    |
| `request_id`     | `string \| undefined`                                                                                                                                         | No       |                                                    |
| `is_compass_web` | `true \| undefined`                                                                                                                                           | No       |                                                    |
| `connection_id`  | `string \| undefined`                                                                                                                                         | No       | The id of the connection associated to this event. |

### Assistant Confirmation Submitted

This event is fired when a user confirms a confirmation message in the assistant chat.

| Property         | Type                                                                                                                                                                             | Required | Description                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `status`         | `"confirmed" \| "rejected"`                                                                                                                                                      | Yes      |                                                    |
| `source`         | `"explain plan" \| "performance insights" \| "connection error" \| "follow-up prompt" \| "analyze output" \| "search stage error" \| "search stage diagnose" \| "chat response"` | Yes      |                                                    |
| `request_id`     | `string \| undefined`                                                                                                                                                            | No       |                                                    |
| `is_compass_web` | `true \| undefined`                                                                                                                                                              | No       |                                                    |
| `connection_id`  | `string \| undefined`                                                                                                                                                            | No       | The id of the connection associated to this event. |

### Assistant Response Generated

This event is fired when the AI response is generated.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `request_id`     | `string \| undefined` | No       |                                                    |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

## Atlas

### Atlas Sign In Error

This event is fired when user failed to sign in to their Atlas account.

| Property         | Type                | Required | Description                            |
| ---------------- | ------------------- | -------- | -------------------------------------- |
| `error`          | `string`            | Yes      | The error message reported on sign in. |
| `is_compass_web` | `true \| undefined` | No       |                                        |

### Atlas Sign In Success

This event is fired when user successfully signed in to their Atlas account

| Property         | Type                | Required | Description                             |
| ---------------- | ------------------- | -------- | --------------------------------------- |
| `auid`           | `string`            | Yes      | The id of the atlas user who signed in. |
| `is_compass_web` | `true \| undefined` | No       |                                         |

### Atlas Sign Out

This event is fired when user signed out from their Atlas account.

| Property         | Type                | Required | Description                              |
| ---------------- | ------------------- | -------- | ---------------------------------------- |
| `auid`           | `string`            | Yes      | The id of the atlas user who signed out. |
| `is_compass_web` | `true \| undefined` | No       |                                          |

## Auto-updates

### Autoupdate Accepted

This event is fired when the "Update available" popup is shown and the user accepts the update.

| Property          | Type                   | Required | Description                                                       |
| ----------------- | ---------------------- | -------- | ----------------------------------------------------------------- |
| `update_version`  | `string \| undefined`  | No       | The version of the update that was accepted.                      |
| `manual_update`   | `boolean \| undefined` | No       | Indicates whether the update was initiated manually by the user.  |
| `manual_download` | `boolean \| undefined` | No       | Indicates whether the update was downloaded manually by the user. |
| `is_compass_web`  | `true \| undefined`    | No       |                                                                   |

### Autoupdate Dismissed

This event is fired when the "Update available" popup is shown and the user rejects the update.

| Property         | Type                | Required | Description                                   |
| ---------------- | ------------------- | -------- | --------------------------------------------- |
| `update_version` | `string`            | Yes      | The version of the update that was dismissed. |
| `is_compass_web` | `true \| undefined` | No       |                                               |

### Application Restart Accepted

This event is fired when the user accepts to restart the application from the update popup.

_No additional properties._

### Autoupdate Enabled

This event is fired when the auto-update feature is enabled.

_No additional properties._

### Autoupdate Disabled

This event is fired when the auto-update feature is disabled.

_No additional properties._

## Bulk Operations

### Bulk Delete Executed

This event is fired when a user runs a bulk delete operation.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `has_filter`     | `boolean`             | Yes      | Specifies if a filter was set in the query         |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Bulk Delete Opened

This event is fired when a user opens the bulk delete modal.

_No additional properties._

### Bulk Update Executed

This event is fired when a user runs a bulk update operation.

| Property                   | Type                  | Required | Description                                                                               |
| -------------------------- | --------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `isUpdatePreviewSupported` | `boolean`             | Yes      | Specifies if update preview was supported (the update preview runs inside a transaction.) |
| `has_filter`               | `boolean`             | Yes      | Specifies if a filter was set in the query                                                |
| `is_compass_web`           | `true \| undefined`   | No       |                                                                                           |
| `connection_id`            | `string \| undefined` | No       | The id of the connection associated to this event.                                        |

### Bulk Update Favorited

This event is fired when a user runs a bulk update operation is added to
favorites.

| Property                   | Type                  | Required | Description                                        |
| -------------------------- | --------------------- | -------- | -------------------------------------------------- |
| `isUpdatePreviewSupported` | `boolean`             | Yes      |                                                    |
| `is_compass_web`           | `true \| undefined`   | No       |                                                    |
| `connection_id`            | `string \| undefined` | No       | The id of the connection associated to this event. |

### Bulk Update Opened

This event is fired when a user opens the bulk update modal.

| Property                   | Type                  | Required | Description                                                                               |
| -------------------------- | --------------------- | -------- | ----------------------------------------------------------------------------------------- |
| `isUpdatePreviewSupported` | `boolean`             | Yes      | Specifies if update preview was supported (the update preview runs inside a transaction.) |
| `is_compass_web`           | `true \| undefined`   | No       |                                                                                           |
| `connection_id`            | `string \| undefined` | No       | The id of the connection associated to this event.                                        |

### Delete Exported

NOTE: NOT IMPLEMENTED YET.
This event is fired when user copies to clipboard the delete query to export
TODO: https://jira.mongodb.org/browse/COMPASS-7334

| Property                 | Type                                                                                               | Required | Description                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `language`               | `"java" \| "javascript" \| "csharp" \| "python" \| "ruby" \| "go" \| "rust" \| "php" \| undefined` | No       |                                                    |
| `with_import_statements` | `boolean \| undefined`                                                                             | No       |                                                    |
| `with_drivers_syntax`    | `boolean \| undefined`                                                                             | No       |                                                    |
| `with_builders`          | `boolean \| undefined`                                                                             | No       |                                                    |
| `is_compass_web`         | `true \| undefined`                                                                                | No       |                                                    |
| `connection_id`          | `string \| undefined`                                                                              | No       | The id of the connection associated to this event. |

### Delete Export Opened

NOTE: NOT IMPLEMENTED YET.
This event is fired when the export to language dialog is open for a delete operation.
TODO: https://jira.mongodb.org/browse/COMPASS-7334

_No additional properties._

### Update Exported

NOTE: NOT IMPLEMENTED YET.
This event is fired when user copies to clipboard the update query to export
TODO: https://jira.mongodb.org/browse/COMPASS-7334

| Property                 | Type                                                                                               | Required | Description                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `language`               | `"java" \| "javascript" \| "csharp" \| "python" \| "ruby" \| "go" \| "rust" \| "php" \| undefined` | No       |                                                    |
| `with_import_statements` | `boolean \| undefined`                                                                             | No       |                                                    |
| `with_drivers_syntax`    | `boolean \| undefined`                                                                             | No       |                                                    |
| `with_builders`          | `boolean \| undefined`                                                                             | No       |                                                    |
| `is_compass_web`         | `true \| undefined`                                                                                | No       |                                                    |
| `connection_id`          | `string \| undefined`                                                                              | No       | The id of the connection associated to this event. |

### Update Export Opened

NOTE: NOT IMPLEMENTED YET.
This event is fired when the export to language dialog is open for an update operation.
TODO: https://jira.mongodb.org/browse/COMPASS-7334

_No additional properties._

## Connection

### Connection Attempt

This event is fired when users attempts to connect to a server/cluster.

| Property         | Type                  | Required | Description                                                |
| ---------------- | --------------------- | -------- | ---------------------------------------------------------- |
| `is_favorite`    | `boolean`             | Yes      | Specifies if the connection is a favorite.                 |
| `is_new`         | `boolean`             | Yes      | Specifies if the connection is a newly created connection. |
| `is_compass_web` | `true \| undefined`   | No       |                                                            |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.         |

### Connection Created

This event is fired when a new connection is saved.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `color`          | `string \| undefined` | No       | The favorite color for the connection created.     |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Connection Disconnected

This event is fired when an active connection is disconnected.

_No additional properties._

### Connection Exported

This event is fired when connections export initiated from either UI or CLI.

| Property         | Type                | Required | Description                     |
| ---------------- | ------------------- | -------- | ------------------------------- |
| `count`          | `number`            | Yes      | Number of connections exported. |
| `is_compass_web` | `true \| undefined` | No       |                                 |

### Connection Failed

This event is fired when a connection attempt fails.

| Property                 | Type                            | Required | Description                                                                                                                                |
| ------------------------ | ------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `error_code`             | `string \| number \| undefined` | No       | The error code (if available).                                                                                                             |
| `error_name`             | `string`                        | Yes      | The error name.                                                                                                                            |
| `error_code_cause_chain` | `{} \| undefined`               | No       | The error codes (or code names) from the error's cause chain. The driver and the OIDC library we use are two places that use cause chains. |
| `auth_type`              | `string \| undefined`           | No       | Desktop only. The authentication type used in the connection.                                                                              |
| `tunnel`                 | `string \| undefined`           | No       | Desktop only. The type of tunneling used in the connection.                                                                                |
| `is_srv`                 | `boolean \| undefined`          | No       | Desktop only. Specifies if SRV is used in the connection.                                                                                  |
| `is_localhost`           | `boolean \| undefined`          | No       | Desktop only. Specifies if the connection is targeting localhost.                                                                          |
| `is_atlas_url`           | `boolean \| undefined`          | No       | Desktop only. Specifies if the connection URL is an Atlas URL.                                                                             |
| `is_do_url`              | `boolean \| undefined`          | No       | Desktop only. Specifies if the connection URL is a DigitalOcean URL.                                                                       |
| `is_public_cloud`        | `boolean \| undefined`          | No       | Desktop only. Specifies if the connection is in a public cloud.                                                                            |
| `public_cloud_name`      | `string \| undefined`           | No       | The name of the public cloud provider, if applicable.                                                                                      |
| `is_csfle`               | `boolean \| undefined`          | No       | Specifies if Client-Side Field Level Encryption (CSFLE) is used.                                                                           |
| `has_csfle_schema`       | `boolean \| undefined`          | No       | Specifies if CSFLE schema is present.                                                                                                      |
| `count_kms_aws`          | `number \| undefined`           | No       | Specifies the number of AWS KMS providers used.                                                                                            |
| `count_kms_gcp`          | `number \| undefined`           | No       | Specifies the number of GCP KMS providers used.                                                                                            |
| `count_kms_kmip`         | `number \| undefined`           | No       | Specifies the number of KMIP KMS providers used.                                                                                           |
| `count_kms_local`        | `number \| undefined`           | No       | Specifies the number of Local KMS providers used.                                                                                          |
| `count_kms_azure`        | `number \| undefined`           | No       | Specifies the number of Azure KMS providers used.                                                                                          |
| `is_compass_web`         | `true \| undefined`             | No       |                                                                                                                                            |
| `connection_id`          | `string \| undefined`           | No       | The id of the connection associated to this event.                                                                                         |

### Connection Imported

This event is fired when connections import initiated from either UI or CLI.

| Property         | Type                | Required | Description                     |
| ---------------- | ------------------- | -------- | ------------------------------- |
| `count`          | `number`            | Yes      | Number of connections imported. |
| `is_compass_web` | `true \| undefined` | No       |                                 |

### Connection Removed

This event is fired when a connection is removed.

_No additional properties._

### New Connection

This event is fired when user successfully connects to a new server/cluster.

| Property                   | Type                   | Required | Description                                                                                                                                                   |
| -------------------------- | ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `is_atlas`                 | `boolean`              | Yes      | Specifies if the connection is targeting an Atlas cluster.                                                                                                    |
| `atlas_hostname`           | `string \| null`       | Yes      | The first resolved SRV hostname in case the connection is targeting an Atlas cluster.                                                                         |
| `is_local_atlas`           | `boolean`              | Yes      | Specifies that the connection is targeting an Atlas local deployment.                                                                                         |
| `is_dataLake`              | `boolean`              | Yes      | Specifies that the connection is targeting an Atlas Data Federation deployment.                                                                               |
| `is_enterprise`            | `boolean`              | Yes      | Specifies that the connection is targeting an Atlas Enterprise deployment.                                                                                    |
| `is_genuine`               | `boolean`              | Yes      | Specifies if the connection is targeting a genuine MongoDB deployment.                                                                                        |
| `non_genuine_server_name`  | `string`               | Yes      | The advertised server name, in case of non-genuine deployment.                                                                                                |
| `server_version`           | `string`               | Yes      | The version of the connected server.                                                                                                                          |
| `server_arch`              | `string \| undefined`  | No       | The host architecture of the connected server.                                                                                                                |
| `server_os_family`         | `string \| undefined`  | No       | The OS family of the connected server.                                                                                                                        |
| `topology_type`            | `string`               | Yes      | The type of connected topology.                                                                                                                               |
| `num_active_connections`   | `number`               | Yes      | The number of saved active connections (doesn't include new connections that are not yet fully saved, like the ones created with the "New Connection" button) |
| `num_inactive_connections` | `number`               | Yes      | The number of inactive connections.                                                                                                                           |
| `user_language`            | `string`               | Yes      | The user's preferred language, as reported by the browser or Electron runtime (e.g. "en-US", "fr", "zh-CN").                                                  |
| `user_languages`           | `{}`                   | Yes      | The user's ordered language preferences, as reported by navigator.languages (e.g. ['en-US', 'en', 'fr']).                                                     |
| `auth_type`                | `string \| undefined`  | No       | Desktop only. The authentication type used in the connection.                                                                                                 |
| `tunnel`                   | `string \| undefined`  | No       | Desktop only. The type of tunneling used in the connection.                                                                                                   |
| `is_srv`                   | `boolean \| undefined` | No       | Desktop only. Specifies if SRV is used in the connection.                                                                                                     |
| `is_localhost`             | `boolean \| undefined` | No       | Desktop only. Specifies if the connection is targeting localhost.                                                                                             |
| `is_atlas_url`             | `boolean \| undefined` | No       | Desktop only. Specifies if the connection URL is an Atlas URL.                                                                                                |
| `is_do_url`                | `boolean \| undefined` | No       | Desktop only. Specifies if the connection URL is a DigitalOcean URL.                                                                                          |
| `is_public_cloud`          | `boolean \| undefined` | No       | Desktop only. Specifies if the connection is in a public cloud.                                                                                               |
| `public_cloud_name`        | `string \| undefined`  | No       | The name of the public cloud provider, if applicable.                                                                                                         |
| `is_csfle`                 | `boolean \| undefined` | No       | Specifies if Client-Side Field Level Encryption (CSFLE) is used.                                                                                              |
| `has_csfle_schema`         | `boolean \| undefined` | No       | Specifies if CSFLE schema is present.                                                                                                                         |
| `count_kms_aws`            | `number \| undefined`  | No       | Specifies the number of AWS KMS providers used.                                                                                                               |
| `count_kms_gcp`            | `number \| undefined`  | No       | Specifies the number of GCP KMS providers used.                                                                                                               |
| `count_kms_kmip`           | `number \| undefined`  | No       | Specifies the number of KMIP KMS providers used.                                                                                                              |
| `count_kms_local`          | `number \| undefined`  | No       | Specifies the number of Local KMS providers used.                                                                                                             |
| `count_kms_azure`          | `number \| undefined`  | No       | Specifies the number of Azure KMS providers used.                                                                                                             |
| `is_compass_web`           | `true \| undefined`    | No       |                                                                                                                                                               |
| `connection_id`            | `string \| undefined`  | No       | The id of the connection associated to this event.                                                                                                            |

## Context Menu

### Context Menu Opened

This event is fired when the context menu is opened.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `item_groups`    | `{}`                | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Context Menu Item Clicked

This event is fired when a context menu item is clicked.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `item_group`     | `string`            | Yes      |             |
| `item_label`     | `string`            | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

## Data Modeling

### Data Modeling Collection Added

This event is fired when user adds a collection in a data modeling diagram.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `source`         | `"toolbar"`         | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Data Modeling Collection Removed

This event is fired when user removes a collection in a data modeling diagram.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `source`         | `"side_panel"`      | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Data Modeling Collection Renamed

This event is fired when user renames a collection in a data modeling diagram.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `source`         | `"side_panel"`      | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Data Modeling Create Diagram Modal Opened

This event is fired when the modal to create a new data modeling diagram is opened

_No additional properties._

### Data Modeling Diagram Creation Started

This event is fired when a new data modeling diagram creation is started

| Property                        | Type                        | Required | Description                                        |
| ------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`               | `number`                    | Yes      |                                                    |
| `automatically_infer_relations` | `boolean`                   | Yes      |                                                    |
| `sample_size`                   | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                | `true \| undefined`         | No       |                                                    |
| `connection_id`                 | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Diagram Creation Relationship Inferral Started

This event is fired when the collections are analyzed and the relationship inferral is started

| Property          | Type                        | Required | Description                                        |
| ----------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections` | `number`                    | Yes      |                                                    |
| `sample_size`     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`  | `true \| undefined`         | No       |                                                    |
| `connection_id`   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Diagram Created

This event is fired when a new data modeling diagram is created
analysis_time_ms is the total time taken to sample collections, build schemas and infer relationships, if applicable.
relationship_inference_phase_ms is the time taken for just the relationship inference phase, if applicable.
The first two phases overlap.

| Property                          | Type                        | Required | Description                                        |
| --------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`                 | `number`                    | Yes      |                                                    |
| `num_relations_inferred`          | `number \| undefined`       | No       |                                                    |
| `analysis_time_ms`                | `number`                    | Yes      |                                                    |
| `relationship_inference_phase_ms` | `number \| undefined`       | No       |                                                    |
| `sample_size`                     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                  | `true \| undefined`         | No       |                                                    |
| `connection_id`                   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Diagram Creation Cancelled

This event is fired when a new data modeling diagram creation is cancelled

| Property                          | Type                        | Required | Description                                        |
| --------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`                 | `number`                    | Yes      |                                                    |
| `automatically_infer_relations`   | `boolean`                   | Yes      |                                                    |
| `analysis_time_ms`                | `number`                    | Yes      |                                                    |
| `relationship_inference_phase_ms` | `number \| undefined`       | No       |                                                    |
| `sample_size`                     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                  | `true \| undefined`         | No       |                                                    |
| `connection_id`                   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Diagram Creation Failed

This event is fired when a new data modeling diagram creation has failed

| Property                          | Type                        | Required | Description                                        |
| --------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`                 | `number`                    | Yes      |                                                    |
| `automatically_infer_relations`   | `boolean`                   | Yes      |                                                    |
| `analysis_time_ms`                | `number`                    | Yes      |                                                    |
| `relationship_inference_phase_ms` | `number \| undefined`       | No       |                                                    |
| `sample_size`                     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                  | `true \| undefined`         | No       |                                                    |
| `connection_id`                   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Add DB Collections Modal Opened

This event is fired when the modal to add DB collections to an existing data modeling diagram is opened

_No additional properties._

### Data Modeling Add DB Collections Started

This event is fired when new collections from the database are to be added to an existing data modeling diagram

| Property                        | Type                        | Required | Description                                        |
| ------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`               | `number`                    | Yes      |                                                    |
| `automatically_infer_relations` | `boolean`                   | Yes      |                                                    |
| `sample_size`                   | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                | `true \| undefined`         | No       |                                                    |
| `connection_id`                 | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Add DB Collections Succeeded

This event is fired when adding new collections from the database has succeeded
analysis_time_ms is the total time taken to sample collections, build schemas and infer relationships, if applicable.
relationship_inference_phase_ms is the time taken for just the relationship inference phase, if applicable.
The first two phases overlap.

| Property                          | Type                        | Required | Description                                        |
| --------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`                 | `number`                    | Yes      |                                                    |
| `num_relations_inferred`          | `number \| undefined`       | No       |                                                    |
| `analysis_time_ms`                | `number`                    | Yes      |                                                    |
| `relationship_inference_phase_ms` | `number \| undefined`       | No       |                                                    |
| `sample_size`                     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                  | `true \| undefined`         | No       |                                                    |
| `connection_id`                   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Add DB Collections Failed

This event is fired when adding new collections from the database has failed

| Property                          | Type                        | Required | Description                                        |
| --------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`                 | `number`                    | Yes      |                                                    |
| `automatically_infer_relations`   | `boolean`                   | Yes      |                                                    |
| `analysis_time_ms`                | `number`                    | Yes      |                                                    |
| `relationship_inference_phase_ms` | `number \| undefined`       | No       |                                                    |
| `sample_size`                     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                  | `true \| undefined`         | No       |                                                    |
| `connection_id`                   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Add DB Collections Cancelled

This event is fired when adding new collections from the database has been cancelled

| Property                          | Type                        | Required | Description                                        |
| --------------------------------- | --------------------------- | -------- | -------------------------------------------------- |
| `num_collections`                 | `number`                    | Yes      |                                                    |
| `automatically_infer_relations`   | `boolean`                   | Yes      |                                                    |
| `analysis_time_ms`                | `number`                    | Yes      |                                                    |
| `relationship_inference_phase_ms` | `number \| undefined`       | No       |                                                    |
| `sample_size`                     | `number \| "all_documents"` | Yes      |                                                    |
| `is_compass_web`                  | `true \| undefined`         | No       |                                                    |
| `connection_id`                   | `string \| undefined`       | No       | The id of the connection associated to this event. |

### Data Modeling Diagram Exported

This event is fired when user exports data modeling diagram.

| Property         | Type                           | Required | Description |
| ---------------- | ------------------------------ | -------- | ----------- |
| `format`         | `"png" \| "json" \| "diagram"` | Yes      |             |
| `is_compass_web` | `true \| undefined`            | No       |             |

### Data Modeling Field Added

This event is fired when user adds a field in a data modeling diagram.

| Property         | Type                        | Required | Description |
| ---------------- | --------------------------- | -------- | ----------- |
| `source`         | `"side_panel" \| "diagram"` | Yes      |             |
| `is_compass_web` | `true \| undefined`         | No       |             |

### Data Modeling Field Removed

This event is fired when user removes a field in a data modeling diagram.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `source`         | `"side_panel"`      | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Data Modeling Field Renamed

This event is fired when user renames a field in a data modeling diagram.

| Property         | Type                        | Required | Description |
| ---------------- | --------------------------- | -------- | ----------- |
| `source`         | `"side_panel" \| "diagram"` | Yes      |             |
| `is_compass_web` | `true \| undefined`         | No       |             |

### Data Modeling Field Type Changed

This event is fired when user changes a field type in a data modeling diagram.

| Property         | Type                        | Required | Description |
| ---------------- | --------------------------- | -------- | ----------- |
| `source`         | `"side_panel" \| "diagram"` | Yes      |             |
| `from`           | `string \| undefined`       | No       |             |
| `to`             | `string \| undefined`       | No       |             |
| `is_compass_web` | `true \| undefined`         | No       |             |

### Data Modeling Diagram Imported

This event is fired when user imports data modeling diagram.

_No additional properties._

### Data Modeling Relationship Added

This event is fired when user adds a new relationship to a data modeling diagram.

| Property            | Type                | Required | Description |
| ------------------- | ------------------- | -------- | ----------- |
| `num_relationships` | `number`            | Yes      |             |
| `is_compass_web`    | `true \| undefined` | No       |             |

### Data Modeling Relationship Form Opened

This event is fired when user edits a relationship in a data modeling diagram.

_No additional properties._

### Data Modeling Relationship Deleted

This event is fired when user deletes a relationship from a data modeling diagram.

| Property            | Type                | Required | Description |
| ------------------- | ------------------- | -------- | ----------- |
| `num_relationships` | `number`            | Yes      |             |
| `is_compass_web`    | `true \| undefined` | No       |             |

## Database / Collection List

### Collection Created

This event is fired when a collection is created.

| Property         | Type                  | Required | Description                                                                          |
| ---------------- | --------------------- | -------- | ------------------------------------------------------------------------------------ |
| `has_collation`  | `boolean`             | Yes      | Indicates whether the collection has a custom collation.                             |
| `is_timeseries`  | `boolean`             | Yes      | Indicates whether the collection is a time series collection.                        |
| `is_clustered`   | `boolean`             | Yes      | Indicates whether the collection is clustered.                                       |
| `is_fle2`        | `boolean`             | Yes      | Indicates whether the collection is encrypted using FLE2 (Field-Level Encryption 2). |
| `expires`        | `boolean`             | Yes      | Indicates whether the collection has an expiration (TTL index).                      |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                      |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                   |

### Database Created

This event is fired when a database is created.

| Property         | Type                  | Required | Description                                                                                                |
| ---------------- | --------------------- | -------- | ---------------------------------------------------------------------------------------------------------- |
| `has_collation`  | `boolean`             | Yes      | Indicates whether the first collection in the database has a custom collation.                             |
| `is_timeseries`  | `boolean`             | Yes      | Indicates whether the first collection in the database is a time series collection.                        |
| `is_clustered`   | `boolean`             | Yes      | Indicates whether the first collection in the database is clustered.                                       |
| `is_fle2`        | `boolean`             | Yes      | Indicates whether the first collection in the database is encrypted using FLE2 (Field-Level Encryption 2). |
| `expires`        | `boolean`             | Yes      | Indicates whether the first collection in the database has an expiration (TTL index).                      |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                                            |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                                                         |

### Switch View Type

This event is fired when the user changes the items view type in the database and collection list between "list" and "grid".

| Property         | Type                         | Required | Description                                                       |
| ---------------- | ---------------------------- | -------- | ----------------------------------------------------------------- |
| `view_type`      | `"list" \| "grid"`           | Yes      | The type of view that the user switched to.                       |
| `item_type`      | `"database" \| "collection"` | Yes      | The type of item being viewed, either 'collection' or 'database'. |
| `is_compass_web` | `true \| undefined`          | No       |                                                                   |
| `connection_id`  | `string \| undefined`        | No       | The id of the connection associated to this event.                |

## Documents

### Document Cloned

This event is fired when user clones a document.

| Property         | Type                          | Required | Description                                        |
| ---------------- | ----------------------------- | -------- | -------------------------------------------------- |
| `mode`           | `"json" \| "list" \| "table"` | Yes      | The view used to clone the document.               |
| `is_compass_web` | `true \| undefined`           | No       |                                                    |
| `connection_id`  | `string \| undefined`         | No       | The id of the connection associated to this event. |

### Document Copied

This event is fired when user copies a document to the clipboard.

| Property         | Type                          | Required | Description                                        |
| ---------------- | ----------------------------- | -------- | -------------------------------------------------- |
| `mode`           | `"json" \| "list" \| "table"` | Yes      | The view used to copy the document.                |
| `is_compass_web` | `true \| undefined`           | No       |                                                    |
| `connection_id`  | `string \| undefined`         | No       | The id of the connection associated to this event. |

### Document Deleted

This event is fired when user deletes a document.

| Property         | Type                          | Required | Description                                        |
| ---------------- | ----------------------------- | -------- | -------------------------------------------------- |
| `mode`           | `"json" \| "list" \| "table"` | Yes      | The view used to delete the document.              |
| `is_compass_web` | `true \| undefined`           | No       |                                                    |
| `connection_id`  | `string \| undefined`         | No       | The id of the connection associated to this event. |

### Document Inserted

This event is fired when user inserts documents.

| Property         | Type                   | Required | Description                                        |
| ---------------- | ---------------------- | -------- | -------------------------------------------------- |
| `mode`           | `string \| undefined`  | No       | The view used to insert documents.                 |
| `multiple`       | `boolean \| undefined` | No       | Specifies if the user inserted multiple documents. |
| `is_compass_web` | `true \| undefined`    | No       |                                                    |
| `connection_id`  | `string \| undefined`  | No       | The id of the connection associated to this event. |

### Document Updated

This event is fired when user updates a document

| Property         | Type                          | Required | Description                                        |
| ---------------- | ----------------------------- | -------- | -------------------------------------------------- |
| `mode`           | `"json" \| "list" \| "table"` | Yes      | The view used to delete the document.              |
| `is_compass_web` | `true \| undefined`           | No       |                                                    |
| `connection_id`  | `string \| undefined`         | No       | The id of the connection associated to this event. |

## Drawer

### Drawer Section Opened

This event is fired when user opens a drawer section. Either by switching
to it via the drawer toolbar or by opening the drawer and the first tab is
this drawer section.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `sectionId`      | `string`            | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Drawer Section Closed

This event is fired when user closes a drawer section. Either by switching
to another tab via the drawer toolbar or by closing the drawer when the
active tab is this drawer section.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `sectionId`      | `string`            | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

## Explain

### Explain Plan Executed

This event is fired when user explains a query.

| Property         | Type                  | Required | Description                                                           |
| ---------------- | --------------------- | -------- | --------------------------------------------------------------------- |
| `with_filter`    | `boolean`             | Yes      | Specifies if a filter was set.                                        |
| `index_used`     | `boolean`             | Yes      | Specifies if the explain reports that an index was used by the query. |
| `is_compass_web` | `true \| undefined`   | No       |                                                                       |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.                    |

## Find Queries

### Query Edited

This event is fired when a user edits a query.

| Property         | Type                                                                                           | Required | Description                                        |
| ---------------- | ---------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `option_name`    | `"maxTimeMS" \| "filter" \| "project" \| "collation" \| "sort" \| "skip" \| "limit" \| "hint"` | Yes      | The name of the edited field.                      |
| `is_compass_web` | `true \| undefined`                                                                            | No       |                                                    |
| `connection_id`  | `string \| undefined`                                                                          | No       | The id of the connection associated to this event. |

### Query Reset Clicked

This event is fired when a user clicks reset button on a query.

| Property         | Type                  | Required | Description                                          |
| ---------------- | --------------------- | -------- | ---------------------------------------------------- |
| `source`         | `string`              | Yes      | Where does the reset originated: CRUD or Schema view |
| `is_compass_web` | `true \| undefined`   | No       |                                                      |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.   |

### Query Executed

This event is fired when user executes a query

| Property            | Type                           | Required | Description                                                        |
| ------------------- | ------------------------------ | -------- | ------------------------------------------------------------------ |
| `has_filter`        | `boolean`                      | Yes      | Indicates whether the query includes a filter.                     |
| `has_projection`    | `boolean`                      | Yes      | Indicates whether the query includes a projection.                 |
| `has_skip`          | `boolean`                      | Yes      | Indicates whether the query includes a skip operation.             |
| `has_sort`          | `boolean`                      | Yes      | Indicates whether the query includes a sort operation.             |
| `default_sort`      | `"none" \| "natural" \| "_id"` | Yes      | Indicates which default sort was set in settings                   |
| `has_limit`         | `boolean`                      | Yes      | Indicates whether the query includes a limit operation.            |
| `has_collation`     | `boolean`                      | Yes      | Indicates whether the query includes a collation.                  |
| `changed_maxtimems` | `boolean`                      | Yes      | Indicates whether the maxTimeMS option was modified for the query. |
| `collection_type`   | `string`                       | Yes      | The type of the collection on which the query was executed.        |
| `used_regex`        | `boolean`                      | Yes      | Indicates whether the query used a regular expression.             |
| `mode`              | `"json" \| "list" \| "table"`  | Yes      | The view used to run the query.                                    |
| `is_compass_web`    | `true \| undefined`            | No       |                                                                    |
| `connection_id`     | `string \| undefined`          | No       | The id of the connection associated to this event.                 |

### Query Exported

This event is fired when user copies to clipboard the query to export.

| Property                 | Type                                                                                               | Required | Description                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| `language`               | `"java" \| "javascript" \| "csharp" \| "python" \| "ruby" \| "go" \| "rust" \| "php" \| undefined` | No       | The language to which the query has been exported.                 |
| `with_import_statements` | `boolean \| undefined`                                                                             | No       | Indicates that the query was exported including import statements. |
| `with_drivers_syntax`    | `boolean \| undefined`                                                                             | No       | Indicates that the query was exported including driver syntax.     |
| `with_builders`          | `boolean \| undefined`                                                                             | No       | Indicates that the query was exported using builder syntax.        |
| `is_compass_web`         | `true \| undefined`                                                                                | No       |                                                                    |
| `connection_id`          | `string \| undefined`                                                                              | No       | The id of the connection associated to this event.                 |

### Query Export Opened

This event is fired when user opens the export to language dialog.

_No additional properties._

### Query History Closed

This event is fired when user closes query history panel

_No additional properties._

### Query History Favorite Added

This event is fired when user favorites a recent query.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `isUpdateQuery`  | `boolean`             | Yes      | Indicates whether the query was an update query.   |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Query History Favorite Copied

This event is fired when user copied query to clipboard.

| Property         | Type                | Required | Description                                                          |
| ---------------- | ------------------- | -------- | -------------------------------------------------------------------- |
| `id`             | `string`            | Yes      | The unique identifier of the query history favorite that was copied. |
| `screen`         | `"my_queries"`      | Yes      | The screen from which the query history favorite was copied.         |
| `is_compass_web` | `true \| undefined` | No       |                                                                      |

### Query History Favorite Removed

This event is fired when user removes query from favorites.

| Property         | Type                                       | Required | Description                                                           |
| ---------------- | ------------------------------------------ | -------- | --------------------------------------------------------------------- |
| `id`             | `string \| undefined`                      | No       | The unique identifier of the query history favorite that was removed. |
| `screen`         | `"my-queries" \| "documents" \| undefined` | No       | The screen from which the query history favorite was removed.         |
| `isUpdateQuery`  | `boolean \| undefined`                     | No       | Indicates whether the removed query was an update query.              |
| `is_compass_web` | `true \| undefined`                        | No       |                                                                       |
| `connection_id`  | `string \| undefined`                      | No       | The id of the connection associated to this event.                    |

### Query History Favorites

This event is fired when user selects "favorites" in query history panel.

_No additional properties._

### Query History Favorite Used

This event is fired when user selects a favorite query to put it in the query bar.

| Property         | Type                                       | Required | Description                                                        |
| ---------------- | ------------------------------------------ | -------- | ------------------------------------------------------------------ |
| `id`             | `string \| undefined`                      | No       | The unique identifier of the query history favorite that was used. |
| `screen`         | `"my-queries" \| "documents" \| undefined` | No       | The screen from which the query history favorite was loaded.       |
| `isUpdateQuery`  | `boolean \| undefined`                     | No       | Indicates whether the loaded query was an update query.            |
| `is_compass_web` | `true \| undefined`                        | No       |                                                                    |
| `connection_id`  | `string \| undefined`                      | No       | The id of the connection associated to this event.                 |

### Query History Opened

This event is fired when user opens query history panel.

_No additional properties._

### Query History Recent

This event is fired when user selects "recent" in query history panel.

_No additional properties._

### Query History Recent Used

This event is fired when user selects a recent query to put it in the query bar.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `isUpdateQuery`  | `boolean`             | Yes      |                                                    |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Query Results Refreshed

This event is fired when user clicks the refresh button in the UI to refresh
the query results.

_No additional properties._

## Gen AI

### AI Opt In Modal Shown

This event is fired when the AI Opt-In Modal is shown to the user.

_No additional properties._

### AI Opt In Modal Dismissed

This event is fired when the AI Opt-In Modal is dismissed by the user.

_No additional properties._

### AI Generate Query Clicked

This event is fired when a user clicks the Generate Query / Aggregation entry point.

| Property         | Type                       | Required | Description                        |
| ---------------- | -------------------------- | -------- | ---------------------------------- |
| `type`           | `"aggregation" \| "query"` | Yes      | The type of query being generated. |
| `is_compass_web` | `true \| undefined`        | No       |                                    |

### AI Prompt Submitted

This event is fired when user enters a prompt in the generative AI textbox
and hits "enter".

| Property               | Type                           | Required | Description                                        |
| ---------------------- | ------------------------------ | -------- | -------------------------------------------------- |
| `editor_view_type`     | `"text" \| "stages" \| "find"` | Yes      | The type of view used to generate the query.       |
| `user_input_length`    | `number \| undefined`          | No       |                                                    |
| `request_id`           | `string \| undefined`          | No       |                                                    |
| `has_sample_documents` | `boolean \| undefined`         | No       |                                                    |
| `is_compass_web`       | `true \| undefined`            | No       |                                                    |
| `connection_id`        | `string \| undefined`          | No       | The id of the connection associated to this event. |

### AI Query Feedback

This event is fired when a user submits feedback for a query generation.

| Property         | Type                       | Required | Description                                        |
| ---------------- | -------------------------- | -------- | -------------------------------------------------- |
| `feedback`       | `"positive" \| "negative"` | Yes      |                                                    |
| `text`           | `string`                   | Yes      |                                                    |
| `request_id`     | `string \| null`           | Yes      |                                                    |
| `is_compass_web` | `true \| undefined`        | No       |                                                    |
| `connection_id`  | `string \| undefined`      | No       | The id of the connection associated to this event. |

### AI Response Failed

This event is fired when a query generation request fails with an error.

| Property           | Type                           | Required | Description                                        |
| ------------------ | ------------------------------ | -------- | -------------------------------------------------- |
| `editor_view_type` | `"text" \| "stages" \| "find"` | Yes      | The type of view used to generate the query.       |
| `error_code`       | `string \| undefined`          | No       |                                                    |
| `status_code`      | `number \| undefined`          | No       |                                                    |
| `error_name`       | `string \| undefined`          | No       |                                                    |
| `request_id`       | `string \| undefined`          | No       |                                                    |
| `is_compass_web`   | `true \| undefined`            | No       |                                                    |
| `connection_id`    | `string \| undefined`          | No       | The id of the connection associated to this event. |

### AI Response Generated

This event is fired when AI query or aggregation generated and successfully
rendered in the UI.

| Property           | Type                           | Required | Description                                        |
| ------------------ | ------------------------------ | -------- | -------------------------------------------------- |
| `editor_view_type` | `"text" \| "stages" \| "find"` | Yes      | The type of view used to generate the query.       |
| `syntax_errors`    | `boolean \| undefined`         | No       |                                                    |
| `query_shape`      | `{} \| undefined`              | No       |                                                    |
| `request_id`       | `string \| undefined`          | No       |                                                    |
| `is_compass_web`   | `true \| undefined`            | No       |                                                    |
| `connection_id`    | `string \| undefined`          | No       | The id of the connection associated to this event. |

### PipelineAI Feedback

This event is fired when a user submits feedback for a pipeline generation.

| Property         | Type                       | Required | Description                                                                                                        |
| ---------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `feedback`       | `"positive" \| "negative"` | Yes      | Wether the feedback was positive or negative.                                                                      |
| `request_id`     | `string \| null`           | Yes      | The id of the request related to this feedback. Useful to correlate feedback to potential error lines in the logs. |
| `text`           | `string`                   | Yes      | The feedback comment left by the user.                                                                             |
| `is_compass_web` | `true \| undefined`        | No       |                                                                                                                    |
| `connection_id`  | `string \| undefined`      | No       | The id of the connection associated to this event.                                                                 |

## Guide Cues

### Guide Cue Dismissed

This event is fired when a user clicks "next" on a guide cue.

| Property         | Type                  | Required | Description                                                                                                                             |
| ---------------- | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `groupId`        | `string \| undefined` | No       | The unique identifier of the group of guide cues to which this cue belongs. This field is only set for guide cues belonging to a group. |
| `cueId`          | `string`              | Yes      | The unique identifier of the specific guide cue that was dismissed.                                                                     |
| `step`           | `number`              | Yes      | The step number within the guide cue sequence where the user clicked "next".                                                            |
| `is_compass_web` | `true \| undefined`   | No       |                                                                                                                                         |

### Guide Cue Group Dismissed

This event is fired when a user clicks "next" on the last guide cue of a
guide cue group.

| Property         | Type                | Required | Description                                                                         |
| ---------------- | ------------------- | -------- | ----------------------------------------------------------------------------------- |
| `groupId`        | `string`            | Yes      | The unique identifier of the group of guide cues that was dismissed.                |
| `cueId`          | `string`            | Yes      | The unique identifier of the specific guide cue that was the last one in the group. |
| `step`           | `number`            | Yes      | The step number within the guide cue sequence where the user clicked "next".        |
| `is_compass_web` | `true \| undefined` | No       |                                                                                     |

## Identify

### Identify

The Segment identify call

| Property               | Type                                                    | Required | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ---------------------- | ------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `compass_version`      | `string`                                                | Yes      | Shortened version number (e.g., '1.29').                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `compass_full_version` | `string`                                                | Yes      | The full version of the Compass application, including additional identifiers such as build metadata or pre-release tags (e.g., '1.29.0-beta.1').                                                                                                                                                                                                                                                                                                                        |
| `compass_distribution` | `"compass" \| "compass-readonly" \| "compass-isolated"` | Yes      | The distribution of Compass being used.                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `compass_channel`      | `"stable" \| "beta" \| "dev"`                           | Yes      | The release channel of Compass. - 'stable' for the general release. - 'beta' for pre-release versions intended for testing. - 'dev' for development versions only distributed internally.                                                                                                                                                                                                                                                                                |
| `platform`             | `string`                                                | Yes      | The platform on which Compass is running, derived from Node.js `os.platform()`. Corresponds to the operating system (e.g., 'darwin' for macOS, 'win32' for Windows, 'linux' for Linux).                                                                                                                                                                                                                                                                                  |
| `arch`                 | `string`                                                | Yes      | The architecture of the system's processor, derived from Node.js `os.arch()`. 'x64' for 64-bit processors and 'arm' for ARM processors.                                                                                                                                                                                                                                                                                                                                  |
| `os_type`              | `string \| undefined`                                   | No       | The type of operating system, including specific operating system names or types (e.g., 'Linux', 'Windows_NT', 'Darwin').                                                                                                                                                                                                                                                                                                                                                |
| `os_version`           | `string \| undefined`                                   | No       | Detailed kernel or system version information. Example: 'Darwin Kernel Version 21.4.0: Fri Mar 18 00:45:05 PDT 2022; root:xnu-8020.101.4~15/RELEASE_X86_64'.                                                                                                                                                                                                                                                                                                             |
| `os_arch`              | `string \| undefined`                                   | No       | The architecture of the operating system, if available, which might be more specific than the system's processor architecture (e.g., 'x86_64' for 64-bit architecture).                                                                                                                                                                                                                                                                                                  |
| `os_release`           | `string \| undefined`                                   | No       | The release identifier of the operating system. This can provide additional details about the operating system release or version (e.g. the kernel version for a specific macOS release). NOTE: This property helps determine the macOS version in use. The reported version corresponds to the Darwin kernel version, which can be mapped to the respective macOS release using the conversion table available at: https://en.wikipedia.org/wiki/MacOS_version_history. |
| `os_linux_dist`        | `string \| undefined`                                   | No       | The Linux distribution name, if running on a Linux-based operating system, derived by reading from `/etc/os-release`. Examples include 'ubuntu', 'debian', or 'rhel'.                                                                                                                                                                                                                                                                                                    |
| `os_linux_release`     | `string \| undefined`                                   | No       | The version of the Linux distribution, if running on a Linux-based operating system, derived by reading from `/etc/os-release`. Examples include '20.04' for Ubuntu or '10' for Debian.                                                                                                                                                                                                                                                                                  |

## Import/Export

### Export Completed

This event is fired when a data export completes.

| Property                    | Type                                                 | Required | Description                                                                                                                                              |
| --------------------------- | ---------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`                      | `"aggregation" \| "query"`                           | Yes      | The type of query for the completed export. (query = find query).                                                                                        |
| `all_docs`                  | `boolean \| undefined`                               | No       | Indicates whether the export was for all documents in the collection.                                                                                    |
| `has_projection`            | `boolean \| undefined`                               | No       | Indicates whether the export query included a projection (a subset of fields).                                                                           |
| `field_option`              | `"all-fields" \| "select-fields" \| undefined`       | No       | Specifies whether all fields were exported or only selected fields.                                                                                      |
| `file_type`                 | `"json" \| "csv"`                                    | Yes      | The file type of the exported data, either CSV or JSON.                                                                                                  |
| `json_format`               | `"default" \| "relaxed" \| "canonical" \| undefined` | No       | Specifies the format of the JSON file if the file_type is 'json'.                                                                                        |
| `field_count`               | `number \| undefined`                                | No       | For exports with field selection, this is the number of fields that were present in the list of available fields and that were selected for export.      |
| `fields_added_count`        | `number \| undefined`                                | No       | For exports with field selection, this is the number of fields that has been added manually by the user.                                                 |
| `fields_not_selected_count` | `number \| undefined`                                | No       | For exports with field selection, this is the number of fields that were present in the list of available fields, but that were not selected for export. |
| `number_of_docs`            | `number \| undefined`                                | No       | The total number of documents exported.                                                                                                                  |
| `success`                   | `boolean`                                            | Yes      | Indicates whether the export operation was successful.                                                                                                   |
| `stopped`                   | `boolean`                                            | Yes      | Indicates whether the export operation was stopped before completion.                                                                                    |
| `duration`                  | `number`                                             | Yes      | The duration of the export operation in milliseconds.                                                                                                    |
| `is_compass_web`            | `true \| undefined`                                  | No       |                                                                                                                                                          |
| `connection_id`             | `string \| undefined`                                | No       | The id of the connection associated to this event.                                                                                                       |

### Export Opened

This event is fired when user opens the export dialog.

| Property         | Type                                                                  | Required | Description                                                                 |
| ---------------- | --------------------------------------------------------------------- | -------- | --------------------------------------------------------------------------- |
| `type`           | `"aggregation" \| "query"`                                            | Yes      | The type of query for which the export has been open. (query = find query). |
| `origin`         | `"menu" \| "crud-toolbar" \| "empty-state" \| "aggregations-toolbar"` | Yes      | The trigger location for the export.                                        |
| `is_compass_web` | `true \| undefined`                                                   | No       |                                                                             |
| `connection_id`  | `string \| undefined`                                                 | No       | The id of the connection associated to this event.                          |

### Import Completed

This event is fired when a data import completes.

| Property                 | Type                                      | Required | Description                                                                                                                                                                  |
| ------------------------ | ----------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `duration`               | `number \| undefined`                     | No       | The duration of the import operation in milliseconds.                                                                                                                        |
| `delimiter`              | `"," \| "\\t" \| ";" \| " " \| undefined` | No       | The delimiter used in the imported file. It could be a comma, tab, semicolon, or space. This field is optional and only applicable if the file_type is 'csv'.                |
| `newline`                | `"\\r\\n" \| "\\n" \| undefined`          | No       | The newline character(s) used in the imported file.                                                                                                                          |
| `file_type`              | `"" \| "json" \| "csv" \| undefined`      | No       | The type of the imported file, such as CSV or JSON.                                                                                                                          |
| `all_fields`             | `boolean \| undefined`                    | No       | Indicates whether all fields in the documents were included in the import. If true, all fields in each document were imported; if false, only selected fields were imported. |
| `stop_on_error_selected` | `boolean \| undefined`                    | No       | Indicates whether the "Stop on Error" option was selected during the import. If true, the import process stops upon encountering an error.                                   |
| `number_of_docs`         | `number \| undefined`                     | No       | The total number of documents imported.                                                                                                                                      |
| `success`                | `boolean \| undefined`                    | No       | Indicates whether the import operation was successful.                                                                                                                       |
| `aborted`                | `boolean \| undefined`                    | No       | Indicates whether the import operation was aborted before completion.                                                                                                        |
| `ignore_empty_strings`   | `boolean \| undefined`                    | No       | Indicates whether empty strings in the imported file were ignored. If true, fields with empty strings were not included in the imported documents.                           |
| `is_compass_web`         | `true \| undefined`                       | No       |                                                                                                                                                                              |
| `connection_id`          | `string \| undefined`                     | No       | The id of the connection associated to this event.                                                                                                                           |

### Import Error Log Opened

This event is fired when a user clicks the link to open the error log after
receiving import errors.

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `errorCount`     | `number`              | Yes      | Number of import errors present in the log.        |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Import Opened

This event is fired when user opens the import dialog.

| Property         | Type                                        | Required | Description                                        |
| ---------------- | ------------------------------------------- | -------- | -------------------------------------------------- |
| `origin`         | `"menu" \| "crud-toolbar" \| "empty-state"` | Yes      | The trigger location for the import.               |
| `is_compass_web` | `true \| undefined`                         | No       |                                                    |
| `connection_id`  | `string \| undefined`                       | No       | The id of the connection associated to this event. |

## Indexes

### Atlas Search Indexes for View Link Clicked

This event is fired when a user clicks the link to Atlas Search in the Indexes tab for a view.

| Property         | Type                | Required | Description                                         |
| ---------------- | ------------------- | -------- | --------------------------------------------------- |
| `context`        | `"Indexes Tab"`     | Yes      | The context/screen from which the link was clicked. |
| `is_compass_web` | `true \| undefined` | No       |                                                     |

### Create Search Index for View Clicked

This event is fired when a user clicks the button to create a search index for a view.

| Property         | Type                | Required | Description                                         |
| ---------------- | ------------------- | -------- | --------------------------------------------------- |
| `context`        | `"Indexes Tab"`     | Yes      | The context/screen from which the link was clicked. |
| `is_compass_web` | `true \| undefined` | No       |                                                     |

### Index Created

This event is fired when user creates an index.

| Property                     | Type                   | Required | Description                                             |
| ---------------------------- | ---------------------- | -------- | ------------------------------------------------------- |
| `unique`                     | `boolean \| undefined` | No       | Indicates whether the index is unique.                  |
| `ttl`                        | `any`                  | No       | Specifies the time-to-live (TTL) setting for the index. |
| `columnstore_index`          | `boolean \| undefined` | No       | Indicates whether the index is a columnstore index.     |
| `has_columnstore_projection` | `any`                  | No       | Indicates if the index has a columnstore projection.    |
| `has_wildcard_projection`    | `any`                  | No       | Indicates if the index includes a wildcard projection.  |
| `custom_collation`           | `any`                  | No       | Specifies if the index uses a custom collation.         |
| `geo`                        | `boolean \| undefined` | No       | Indicates whether the index is a geospatial index.      |
| `atlas_search`               | `boolean \| undefined` | No       | Indicates whether the index is an Atlas Search index.   |
| `type`                       | `string \| undefined`  | No       | Specifies the type of the index.                        |
| `is_compass_web`             | `true \| undefined`    | No       |                                                         |
| `connection_id`              | `string \| undefined`  | No       | The id of the connection associated to this event.      |

### Index Create Failed

This event is fired when user creates an index and it fails.

| Property                     | Type                   | Required | Description                                             |
| ---------------------------- | ---------------------- | -------- | ------------------------------------------------------- |
| `unique`                     | `boolean \| undefined` | No       | Indicates whether the index is unique.                  |
| `ttl`                        | `any`                  | No       | Specifies the time-to-live (TTL) setting for the index. |
| `columnstore_index`          | `boolean \| undefined` | No       | Indicates whether the index is a columnstore index.     |
| `has_columnstore_projection` | `any`                  | No       | Indicates if the index has a columnstore projection.    |
| `has_wildcard_projection`    | `any`                  | No       | Indicates if the index includes a wildcard projection.  |
| `custom_collation`           | `any`                  | No       | Specifies if the index uses a custom collation.         |
| `geo`                        | `boolean \| undefined` | No       | Indicates whether the index is a geospatial index.      |
| `atlas_search`               | `boolean \| undefined` | No       | Indicates whether the index is an Atlas Search index.   |
| `type`                       | `string \| undefined`  | No       | Specifies the type of the index.                        |
| `is_compass_web`             | `true \| undefined`    | No       |                                                         |
| `connection_id`              | `string \| undefined`  | No       | The id of the connection associated to this event.      |

### Index Create Opened

This event is fired when user opens create index dialog.

| Property         | Type                   | Required | Description                                                               |
| ---------------- | ---------------------- | -------- | ------------------------------------------------------------------------- |
| `atlas_search`   | `boolean \| undefined` | No       | Specifies if the index creation dialog open is for an Atlas Search index. |
| `is_compass_web` | `true \| undefined`    | No       |                                                                           |
| `connection_id`  | `string \| undefined`  | No       | The id of the connection associated to this event.                        |

### Index Dropped

This event is fired when user drops an index.

| Property         | Type                   | Required | Description                                           |
| ---------------- | ---------------------- | -------- | ----------------------------------------------------- |
| `atlas_search`   | `boolean \| undefined` | No       | Indicates whether the index is an Atlas Search index. |
| `is_compass_web` | `true \| undefined`    | No       |                                                       |
| `connection_id`  | `string \| undefined`  | No       | The id of the connection associated to this event.    |

### Index Edited

This event is fired when user updates an index.

| Property         | Type                  | Required | Description                                           |
| ---------------- | --------------------- | -------- | ----------------------------------------------------- |
| `atlas_search`   | `boolean`             | Yes      | Indicates whether the index is an Atlas Search index. |
| `is_compass_web` | `true \| undefined`   | No       |                                                       |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.    |

### Index Create Action Clicked

This event is fired when user clicks a create action in the indexes drawer
(e.g. "Standard Index", "Search Index", "Vector Search Index").

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the action was clicked. |
| `index_type`     | `string`                        | Yes      | The type of index being created.                      |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Index Edit Action Clicked

This event is fired when user clicks the edit action on a search index.

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the action was clicked. |
| `index_type`     | `string`                        | Yes      | The type of index being edited.                       |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Index Drop Action Clicked

This event is fired when user clicks the drop action on a search index.

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the action was clicked. |
| `index_type`     | `string`                        | Yes      | The type of index being dropped.                      |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Index Refresh Clicked

This event is fired when user clicks the refresh button in the indexes drawer.

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Manage Search Indexes Link Clicked

This event is fired when a user clicks the "Manage your search indexes" link
in the Indexes toolbar to navigate to Atlas Search.

| Property         | Type                | Required | Description                                         |
| ---------------- | ------------------- | -------- | --------------------------------------------------- |
| `context`        | `"Indexes Tab"`     | Yes      | The context/screen from which the link was clicked. |
| `is_compass_web` | `true \| undefined` | No       |                                                     |

## Mock Data Generator

### Mock Data Generator CTA Button Viewed

This event is fired when the Mock Data Generator CTA button is viewed.

| Property                     | Type                | Required | Description |
| ---------------------------- | ------------------- | -------- | ----------- |
| `button_enabled`             | `boolean`           | Yes      |             |
| `gen_ai_features_enabled`    | `boolean`           | Yes      |             |
| `send_sample_values_enabled` | `boolean`           | Yes      |             |
| `is_compass_web`             | `true \| undefined` | No       |             |

### Mock Data Generator Opened

This event is fired when the user clicks the enabled "Generate Mock Data" button in the collection tab header.

| Property                     | Type                | Required | Description |
| ---------------------------- | ------------------- | -------- | ----------- |
| `gen_ai_features_enabled`    | `boolean`           | Yes      |             |
| `send_sample_values_enabled` | `boolean`           | Yes      |             |
| `is_compass_web`             | `true \| undefined` | No       |             |

### Mock Data Generator Screen Viewed

This event is fired when the user views a screen in the Mock Data Generator modal.

| Property         | Type                      | Required | Description |
| ---------------- | ------------------------- | -------- | ----------- |
| `screen`         | `MockDataGeneratorScreen` | Yes      |             |
| `is_compass_web` | `true \| undefined`       | No       |             |

### Mock Data Generator Screen Proceeded

This event is fired when the user proceeds to the next screen or finishes the mock data generator modal.

| Property         | Type                                  | Required | Description |
| ---------------- | ------------------------------------- | -------- | ----------- |
| `from_screen`    | `MockDataGeneratorScreen`             | Yes      |             |
| `to_screen`      | `MockDataGeneratorScreen \| "finish"` | Yes      |             |
| `is_compass_web` | `true \| undefined`                   | No       |             |

### Mock Data Generator Dismissed

This event is fired when the user closes the mock data generator modal.

| Property                     | Type                      | Required | Description |
| ---------------------------- | ------------------------- | -------- | ----------- |
| `screen`                     | `MockDataGeneratorScreen` | Yes      |             |
| `gen_ai_features_enabled`    | `boolean`                 | Yes      |             |
| `send_sample_values_enabled` | `boolean`                 | Yes      |             |
| `is_compass_web`             | `true \| undefined`       | No       |             |

### Mock Data Document Count Changed

This event is fired when the user changes the document count for the mock data generator modal.

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `document_count` | `number`            | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Mock Data Script Generated

This event is fired when the user generates a script in the mock data generator modal.

| Property            | Type                | Required | Description |
| ------------------- | ------------------- | -------- | ----------- |
| `field_count`       | `number`            | Yes      |             |
| `output_docs_count` | `number`            | Yes      |             |
| `is_compass_web`    | `true \| undefined` | No       |             |

### Mock Data Script Copied

This event is fired when the user copies the mongosh script in the script screen of the mock data generator modal.

| Property         | Type                 | Required | Description |
| ---------------- | -------------------- | -------- | ----------- |
| `step`           | `MockDataScriptStep` | Yes      |             |
| `is_compass_web` | `true \| undefined`  | No       |             |

## My Queries

### My Queries Filter

This event is fired when user filters queries using db / coll filter.

| Property         | Type                                      | Required | Description                  |
| ---------------- | ----------------------------------------- | -------- | ---------------------------- |
| `type`           | `"database" \| "collection" \| undefined` | No       | The filter that was changed. |
| `is_compass_web` | `true \| undefined`                       | No       |                              |

### My Queries Search

This event is fired when user filters queries using search
input (fires only on input blur).

_No additional properties._

### My Queries Sort

This event is fired when user sorts items in the list using one of the
sort options.

| Property         | Type                                                                               | Required | Description                                    |
| ---------------- | ---------------------------------------------------------------------------------- | -------- | ---------------------------------------------- |
| `sort_by`        | `"name" \| "id" \| "type" \| "database" \| "collection" \| "lastModified" \| null` | Yes      | The criterion by which the queries are sorted. |
| `order`          | `"ascending" \| "descending"`                                                      | Yes      | The order of the sorting.                      |
| `is_compass_web` | `true \| undefined`                                                                | No       |                                                |

## Other

### Application Launched

This event is fired when the application launch is initiated.

| Property            | Type                                | Required | Description                                                                                                                                                                                                    |
| ------------------- | ----------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `context`           | `"terminal" \| "desktop_app"`       | Yes      | The context from which the application was launched. (NOT whether it is used as a CLI-only tool or not)                                                                                                        |
| `launch_connection` | `"string" \| "JSON_file" \| "none"` | Yes      | Whether Compass was instructed to automatically connect to a specific cluster using a connection string on the command line, a JSON file containing an exported connection on the command line, or not at all. |
| `protected`         | `boolean \| undefined`              | No       | Whether the `protectConnectionStrings` preference was set at launch.                                                                                                                                           |
| `readOnly`          | `boolean`                           | Yes      | Whether the `readOnly` preference was set at launch (including the compass-readonly distribution).                                                                                                             |
| `maxTimeMS`         | `number \| undefined`               | No       | The value of the `maxTimeMS` preference at launch.                                                                                                                                                             |
| `global_config`     | `boolean`                           | Yes      | Whether any preferences were specified in the global configuration file.                                                                                                                                       |
| `cli_args`          | `boolean`                           | Yes      | Whether any preferences were specified using CLI arguments.                                                                                                                                                    |
| `is_compass_web`    | `true \| undefined`                 | No       |                                                                                                                                                                                                                |

### Atlas Link Clicked

This event is fired when a user clicks on the Atlas CTA.

| Property         | Type                                      | Required | Description                                      |
| ---------------- | ----------------------------------------- | -------- | ------------------------------------------------ |
| `screen`         | `"agg_builder" \| "connect" \| undefined` | No       | The screen from which the Atlas CTA was clicked. |
| `is_compass_web` | `true \| undefined`                       | No       |                                                  |

### Error Fetching Attributes

This event is fired when we fail to track another event due to an exception
while building the attributes.

| Property         | Type                | Required | Description                                                      |
| ---------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `event_name`     | `string`            | Yes      | The name of the event for which attributes could not be fetched. |
| `is_compass_web` | `true \| undefined` | No       |                                                                  |

### Performance Advisor Clicked

This event is fired when a user clicks on the Performance Advisor CTA.

_No additional properties._

### Assistant Tool Call Approval

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `type`           | `string`              | Yes      |                                                    |
| `approved`       | `boolean`             | Yes      |                                                    |
| `approval_id`    | `string`              | Yes      |                                                    |
| `request_id`     | `string \| undefined` | No       |                                                    |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### Screen

This event is fired when a user activates (i.e., navigates to) a screen.

| Property         | Type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Required | Description                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------- |
| `name`           | `"my_queries" \| "aggregations" \| "documents" \| "collections" \| "databases" \| "indexes" \| "globalwrites" \| "performance" \| "schema" \| "validation" \| "confirm_new_pipeline_modal" \| "create_collection_modal" \| "create_database_modal" \| "drop_collection_modal" \| "drop_database_modal" \| "create_index_modal" \| "create_search_index_modal" \| "create_view_modal" \| "csfle_connection_modal" \| "delete_pipeline_modal" \| "drop_index_modal" \| "export_modal" \| "export_to_language_modal" \| "import_modal" \| "insert_document_modal" \| "non_genuine_mongodb_modal" \| "rename_collection_modal" \| "restore_pipeline_modal" \| "save_pipeline_modal" \| "shell_info_modal" \| "update_search_index_modal" \| "end_of_life_mongodb_modal" \| "export_diagram_modal" \| "indexes_list_drawer" \| "create_search_index_drawer" \| "edit_search_index_drawer" \| undefined` | No       | The name of the screen that was activated.         |
| `is_compass_web` | `true \| undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No       |                                                    |
| `connection_id`  | `string \| undefined`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              | No       | The id of the connection associated to this event. |

### Secret Storage Not Available

This event is fired at startup when we detect that the application is running on
a system that doesn't offer a suitable secret storage backend.

_No additional properties._

### Experiment Viewed

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `test_name`      | `string`            | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

### Create Index Button Clicked

| Property         | Type                   | Required | Description |
| ---------------- | ---------------------- | -------- | ----------- |
| `context`        | `"Create Index Modal"` | Yes      |             |
| `is_compass_web` | `true \| undefined`    | No       |             |

### Cancel Button Clicked

| Property         | Type                   | Required | Description |
| ---------------- | ---------------------- | -------- | ----------- |
| `context`        | `"Create Index Modal"` | Yes      |             |
| `is_compass_web` | `true \| undefined`    | No       |             |

### Create Index Modal Closed

| Property         | Type                   | Required | Description |
| ---------------- | ---------------------- | -------- | ----------- |
| `context`        | `"Create Index Modal"` | Yes      |             |
| `is_compass_web` | `true \| undefined`    | No       |             |

### New Index Field Added

| Property         | Type                   | Required | Description |
| ---------------- | ---------------------- | -------- | ----------- |
| `context`        | `"Create Index Modal"` | Yes      |             |
| `is_compass_web` | `true \| undefined`    | No       |             |

### Options Clicked

| Property         | Type                   | Required | Description |
| ---------------- | ---------------------- | -------- | ----------- |
| `context`        | `"Create Index Modal"` | Yes      |             |
| `is_compass_web` | `true \| undefined`    | No       |             |

### UUID Encountered

| Property         | Type                | Required | Description |
| ---------------- | ------------------- | -------- | ----------- |
| `subtype`        | `3 \| 4`            | Yes      |             |
| `count`          | `number`            | Yes      |             |
| `is_compass_web` | `true \| undefined` | No       |             |

## Performance Tab

### CurrentOp showOperationDetails

This event is fired when a user clicks to show the details of an operation.

_No additional properties._

### DetailView hideOperationDetails

This event is fired when a user clicks to hide the details of an operation.

_No additional properties._

### DetailView killOp

This event is fired when a user clicks to kill an operation.

_No additional properties._

### Performance Paused

This event is fired when a user pauses the performance screen.

_No additional properties._

### Performance Resumed

This event is fired when a user resumes a paused performance screen.

_No additional properties._

## Proactive Performance Insights

### Signal Action Button Clicked

This event is fired when Action button for the signal is clicked inside the popup.

| Property         | Type                | Required | Description                                     |
| ---------------- | ------------------- | -------- | ----------------------------------------------- |
| `id`             | `string`            | Yes      | A unique identifier for the type of the signal. |
| `is_compass_web` | `true \| undefined` | No       |                                                 |

### Signal Closed

This event is fired when user clicked the close button or outside the signal and closed the popup.

| Property         | Type                | Required | Description                                     |
| ---------------- | ------------------- | -------- | ----------------------------------------------- |
| `id`             | `string`            | Yes      | A unique identifier for the type of the signal. |
| `is_compass_web` | `true \| undefined` | No       |                                                 |

### Signal Link Clicked

This event is fired when "Learn more" link is clicked inside the signal popup.

| Property         | Type                | Required | Description                                     |
| ---------------- | ------------------- | -------- | ----------------------------------------------- |
| `id`             | `string`            | Yes      | A unique identifier for the type of the signal. |
| `is_compass_web` | `true \| undefined` | No       |                                                 |

### Signal Opened

This event is fired when signal badge is clicked and popup is opened.

| Property         | Type                | Required | Description                                     |
| ---------------- | ------------------- | -------- | ----------------------------------------------- |
| `id`             | `string`            | Yes      | A unique identifier for the type of the signal. |
| `is_compass_web` | `true \| undefined` | No       |                                                 |

### Signal Shown

This event is fired when signal icon badge is rendered on the screen visible to the user.

| Property         | Type                | Required | Description                                     |
| ---------------- | ------------------- | -------- | ----------------------------------------------- |
| `id`             | `string`            | Yes      | A unique identifier for the type of the signal. |
| `is_compass_web` | `true \| undefined` | No       |                                                 |

## Schema

### Schema Analysis Started

This event is fired when the schema analysis is started

_No additional properties._

### Schema Analysis Failed

This event is fired when schema analysis fails due to a query timeout or a general error.

| Property           | Type                     | Required | Description                                                                  |
| ------------------ | ------------------------ | -------- | ---------------------------------------------------------------------------- |
| `error_type`       | `"timeout" \| "general"` | Yes      | The category of error that caused the failure.                               |
| `with_filter`      | `boolean`                | Yes      | Indicates whether a filter was applied during the schema analysis.           |
| `analysis_time_ms` | `number`                 | Yes      | The time taken when analyzing the schema, before it failed, in milliseconds. |
| `is_compass_web`   | `true \| undefined`      | No       |                                                                              |
| `connection_id`    | `string \| undefined`    | No       | The id of the connection associated to this event.                           |

### Schema Analysis Cancelled

This event is fired when user cancels the schema analysis.

| Property           | Type                  | Required | Description                                                                        |
| ------------------ | --------------------- | -------- | ---------------------------------------------------------------------------------- |
| `with_filter`      | `boolean`             | Yes      | Indicates whether a filter was applied during the schema analysis.                 |
| `analysis_time_ms` | `number`              | Yes      | The time taken when analyzing the schema, before being cancelled, in milliseconds. |
| `is_compass_web`   | `true \| undefined`   | No       |                                                                                    |
| `connection_id`    | `string \| undefined` | No       | The id of the connection associated to this event.                                 |

### Schema Analyzed

This event is fired when user analyzes the schema.

| Property               | Type                       | Required | Description                                                                                                                                                         |
| ---------------------- | -------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `with_filter`          | `boolean`                  | Yes      | Indicates whether a filter was applied during the schema analysis.                                                                                                  |
| `schema_width`         | `number`                   | Yes      | The number of fields at the top level.                                                                                                                              |
| `field_types`          | `{ [x: string]: number; }` | Yes      | Key/value pairs of bsonType and count.                                                                                                                              |
| `variable_type_count`  | `number`                   | Yes      | The count of fields with multiple types in a given schema (not counting undefined). This is only calculated for the top level fields, not nested fields and arrays. |
| `optional_field_count` | `number`                   | Yes      | The count of fields that don't appear on all documents. This is only calculated for the top level fields, not nested fields and arrays.                             |
| `schema_depth`         | `number`                   | Yes      | The number of nested levels.                                                                                                                                        |
| `geo_data`             | `boolean`                  | Yes      | Indicates whether the schema contains geospatial data.                                                                                                              |
| `distinct_field_count` | `number`                   | Yes      | The total count of distinct fields across all nesting levels in the schema, including fields nested within documents and arrays of documents.                       |
| `analysis_time_ms`     | `number`                   | Yes      | The time taken to analyze the schema, in milliseconds.                                                                                                              |
| `is_compass_web`       | `true \| undefined`        | No       |                                                                                                                                                                     |
| `connection_id`        | `string \| undefined`      | No       | The id of the connection associated to this event.                                                                                                                  |

### Schema Exported

This event is fired when user shares the schema.

| Property         | Type                                                                | Required | Description                                               |
| ---------------- | ------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `has_schema`     | `boolean`                                                           | Yes      | Indicates whether the schema was analyzed before sharing. |
| `format`         | `"standardJSON" \| "mongoDBJSON" \| "expandedJSON" \| "legacyJSON"` | Yes      |                                                           |
| `source`         | `"app_menu" \| "schema_tab"`                                        | Yes      |                                                           |
| `schema_width`   | `number`                                                            | Yes      | The number of fields at the top level.                    |
| `schema_depth`   | `number`                                                            | Yes      | The number of nested levels.                              |
| `geo_data`       | `boolean`                                                           | Yes      | Indicates whether the schema contains geospatial data.    |
| `is_compass_web` | `true \| undefined`                                                 | No       |                                                           |
| `connection_id`  | `string \| undefined`                                               | No       | The id of the connection associated to this event.        |

### Schema Export Failed

This event is fired when user shares the schema.

| Property         | Type                                                                | Required | Description                                               |
| ---------------- | ------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `has_schema`     | `boolean`                                                           | Yes      | Indicates whether the schema was analyzed before sharing. |
| `schema_length`  | `number`                                                            | Yes      |                                                           |
| `format`         | `"standardJSON" \| "mongoDBJSON" \| "expandedJSON" \| "legacyJSON"` | Yes      |                                                           |
| `stage`          | `string`                                                            | Yes      |                                                           |
| `is_compass_web` | `true \| undefined`                                                 | No       |                                                           |
| `connection_id`  | `string \| undefined`                                               | No       | The id of the connection associated to this event.        |

## Schema Validation

### Schema Validation Added

This event is fired when user adds validation rules.

_No additional properties._

### Schema Validation Edited

This event is fired when user edits validation rules (without saving them).

| Property         | Type                  | Required | Description                                            |
| ---------------- | --------------------- | -------- | ------------------------------------------------------ |
| `json_schema`    | `boolean`             | Yes      | Indicates wether the validation rule uses $jsonSchema. |
| `is_compass_web` | `true \| undefined`   | No       |                                                        |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event.     |

### Schema Validation Updated

This event is fired when user saves validation rules.

| Property            | Type                                 | Required | Description                                          |
| ------------------- | ------------------------------------ | -------- | ---------------------------------------------------- |
| `validation_action` | `"error" \| "warn" \| "errorAndLog"` | Yes      | The validation action passed to the driver.          |
| `validation_level`  | `"off" \| "moderate" \| "strict"`    | Yes      | The level of schema validation passed to the driver. |
| `is_compass_web`    | `true \| undefined`                  | No       |                                                      |
| `connection_id`     | `string \| undefined`                | No       | The id of the connection associated to this event.   |

### Schema Validation Generated

This event is fired when user generates validation rules.

| Property               | Type                  | Required | Description                                                                                                                             |
| ---------------------- | --------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `variable_type_count`  | `number`              | Yes      |                                                                                                                                         |
| `optional_field_count` | `number`              | Yes      | The count of fields that don't appear on all documents. This is only calculated for the top level fields, not nested fields and arrays. |
| `is_compass_web`       | `true \| undefined`   | No       |                                                                                                                                         |
| `connection_id`        | `string \| undefined` | No       | The id of the connection associated to this event.                                                                                      |

## Search Indexes

### Search Index Edit Link Clicked

This event is fired when user clicks the "Edit Search Index" link in the
server error banner.

| Property         | Type                            | Required | Description                                         |
| ---------------- | ------------------------------- | -------- | --------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the link was clicked. |
| `is_compass_web` | `true \| undefined`             | No       |                                                     |

### Search Index View Indexes Link Clicked

This event is fired when user clicks the "View Search Indexes" link in the
search index does not exist banner.

| Property         | Type                            | Required | Description                                         |
| ---------------- | ------------------------------- | -------- | --------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the link was clicked. |
| `is_compass_web` | `true \| undefined`             | No       |                                                     |

### Search Index Create Link Clicked

This event is fired when user clicks the "Create a New Index" link in the
search index does not exist banner.

| Property         | Type                            | Required | Description                                         |
| ---------------- | ------------------------------- | -------- | --------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the link was clicked. |
| `index_type`     | `string`                        | Yes      | The type of index being created.                    |
| `is_compass_web` | `true \| undefined`             | No       |                                                     |

### Search Index View Definition Link Clicked

This event is fired when user clicks the "View Index Definition" link in the
stale results banner.

| Property         | Type                            | Required | Description                                         |
| ---------------- | ------------------------------- | -------- | --------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the link was clicked. |
| `is_compass_web` | `true \| undefined`             | No       |                                                     |

### Search Index View Indexes Button Clicked

This event is fired when user clicks the "View Indexes" button in the stage toolbar.

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the button was clicked. |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Search Index Create Submitted

This event is fired when user submits the create search index form in the drawer.

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the form was submitted. |
| `index_type`     | `string`                        | Yes      | The type of index being created.                      |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Search Index Create Cancelled

This event is fired when user cancels creating a search index in the drawer.

| Property         | Type                            | Required | Description                                                  |
| ---------------- | ------------------------------- | -------- | ------------------------------------------------------------ |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the cancel button was clicked. |
| `index_type`     | `string`                        | Yes      | The type of index that was being created.                    |
| `is_compass_web` | `true \| undefined`             | No       |                                                              |

### Search Index Edit Submitted

This event is fired when user submits the edit search index form in the drawer.

| Property         | Type                            | Required | Description                                           |
| ---------------- | ------------------------------- | -------- | ----------------------------------------------------- |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the form was submitted. |
| `index_type`     | `string`                        | Yes      | The type of index being edited.                       |
| `is_compass_web` | `true \| undefined`             | No       |                                                       |

### Search Index Edit Cancelled

This event is fired when user cancels editing a search index in the drawer.

| Property         | Type                            | Required | Description                                                  |
| ---------------- | ------------------------------- | -------- | ------------------------------------------------------------ |
| `context`        | `SearchIndexesTelemetryContext` | Yes      | The context/screen from which the cancel button was clicked. |
| `index_type`     | `string`                        | Yes      | The type of index that was being edited.                     |
| `is_compass_web` | `true \| undefined`             | No       |                                                              |

### Search Index Status Details Link Clicked

This event is fired when user clicks the "View Status Details by Node" link
in the index build failed toast.

| Property         | Type                | Required | Description            |
| ---------------- | ------------------- | -------- | ---------------------- |
| `index_type`     | `string`            | Yes      | The type of the index. |
| `is_compass_web` | `true \| undefined` | No       |                        |

## Settings

### Setting Changed

This event is fired when a user toggles a setting in the settings modal.

| Property         | Type                | Required | Description                               |
| ---------------- | ------------------- | -------- | ----------------------------------------- |
| `setting`        | `string`            | Yes      | The name of the setting that was changed. |
| `is_compass_web` | `true \| undefined` | No       |                                           |

### Theme Changed

This event is fired when a user changes the theme.

| Property         | Type                              | Required | Description                                                               |
| ---------------- | --------------------------------- | -------- | ------------------------------------------------------------------------- |
| `theme`          | `"DARK" \| "LIGHT" \| "OS_THEME"` | Yes      | The theme selected by the user. It can be 'DARK', 'LIGHT', or 'OS_THEME'. |
| `is_compass_web` | `true \| undefined`               | No       |                                                                           |

## Shell

### Open Shell

This event is fired when the shell is open

| Property         | Type                  | Required | Description                                        |
| ---------------- | --------------------- | -------- | -------------------------------------------------- |
| `entrypoint`     | `string \| undefined` | No       |                                                    |
| `is_compass_web` | `true \| undefined`   | No       |                                                    |
| `connection_id`  | `string \| undefined` | No       | The id of the connection associated to this event. |

### `Shell ${string}`

This is a group of events forwarded from the embedded shell.
Every event from the shell is forwarded adding the "Shell " prefix to the original
event name.

Note: each forwarded event is exposing a different set of properties in
addition to the `mongosh_version` and `session_id`. Refer to the mongosh
tracking plan for details about single events.

| Property          | Type                  | Required | Description                                        |
| ----------------- | --------------------- | -------- | -------------------------------------------------- |
| `mongosh_version` | `string`              | Yes      | The version of the embedded mongosh package.       |
| `session_id`      | `string`              | Yes      | The shell session_id.                              |
| `is_compass_web`  | `true \| undefined`   | No       |                                                    |
| `connection_id`   | `string \| undefined` | No       | The id of the connection associated to this event. |

## Web Vitals

### First Contentful Paint

This event is fired at startup to report the First Contentful Paint metric.
See: https://web.dev/articles/vitals.

| Property         | Type                | Required | Description                |
| ---------------- | ------------------- | -------- | -------------------------- |
| `value`          | `number`            | Yes      | The reported metric value. |
| `is_compass_web` | `true \| undefined` | No       |                            |

### Largest Contentful Paint

This event is fired at startup to report the Largest Contentful Paint metric.
See: https://web.dev/articles/vitals.

| Property         | Type                | Required | Description                |
| ---------------- | ------------------- | -------- | -------------------------- |
| `value`          | `number`            | Yes      | The reported metric value. |
| `is_compass_web` | `true \| undefined` | No       |                            |

### First Input Delay

This event is fired at startup to report the First Input Delay metric.
See: https://web.dev/articles/vitals.

| Property         | Type                | Required | Description                |
| ---------------- | ------------------- | -------- | -------------------------- |
| `value`          | `number`            | Yes      | The reported metric value. |
| `is_compass_web` | `true \| undefined` | No       |                            |

### Cumulative Layout Shift

This event is fired at startup to report the Cumulative Layout Shift metric.
See: https://web.dev/articles/vitals.

| Property         | Type                | Required | Description                |
| ---------------- | ------------------- | -------- | -------------------------- |
| `value`          | `number`            | Yes      | The reported metric value. |
| `is_compass_web` | `true \| undefined` | No       |                            |

### Time to First Byte

This event is fired at startup to report the Time to First Byte metric.
See: https://web.dev/articles/vitals.

| Property         | Type                | Required | Description                |
| ---------------- | ------------------- | -------- | -------------------------- |
| `value`          | `number`            | Yes      | The reported metric value. |
| `is_compass_web` | `true \| undefined` | No       |                            |

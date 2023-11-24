import type { Action } from 'redux';
import { combineReducers } from 'redux';
import type { AtlasService } from '@mongodb-js/atlas-service/renderer';
import dataService from './data-service';
import type { FieldsAction } from './fields';
import fields from './fields';
import editViewName from './edit-view-name';
import sourceName from './source-name';
import type { PipelineBuilderAction } from './pipeline-builder';
import pipelineBuilder from './pipeline-builder';
import type { InputDocumentsAction } from './input-documents';
import inputDocuments from './input-documents';
import namespace from './namespace';
import env from './env';
import isTimeSeries from './is-time-series';
import serverVersion from './server-version';
import isModified from './is-modified';
import name from './name';
import limit from './limit';
import largeLimit from './large-limit';
import type { MaxTimeMSChangedAction } from './max-time-ms';
import maxTimeMS from './max-time-ms';
import type { CollationStringAction } from './collation-string';
import collationString from './collation-string';
import comments from './comments';
import type { AutoPreviewAction } from './auto-preview';
import autoPreview from './auto-preview';
import type { IdAction } from './id';
import id from './id';
import type { SavedPipelineAction } from './saved-pipeline';
import savedPipeline from './saved-pipeline';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import type { SettingsAction } from './settings';
import settings from './settings';
import type { SavingPipelineAction } from './saving-pipeline';
import savingPipeline from './saving-pipeline';
import outResultsFn from './out-results-fn';
import type { UpdateViewAction } from './update-view';
import updateViewError from './update-view';
import type { Actions as AggregationActions } from './aggregation';
import aggregation from './aggregation';
import type { Actions as CountDocumentsActions } from './count-documents';
import countDocuments from './count-documents';
import isDataLake from './is-datalake';
import type { Actions as WorkspaceActions } from './workspace';
import workspace from './workspace';
import aggregationWorkspaceId from './aggregation-workspace-id';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { PipelineBuilder } from './pipeline-builder/pipeline-builder';
import type { PipelineStorage } from '@mongodb-js/my-queries-storage';
import type { FocusModeAction } from './focus-mode';
import focusMode from './focus-mode';
import type { SidePanelAction } from './side-panel';
import sidePanel from './side-panel';
import type { CollectionFieldsAction } from './collections-fields';
import collectionsFields from './collections-fields';
import type { InsightsAction } from './insights';
import insights from './insights';
import type { SearchIndexesAction } from './search-indexes';
import searchIndexes from './search-indexes';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import type { ClonePipelineAction } from './clone-pipeline';

/**
 * The main application reducer.
 *
 * this does not include save state and restore state reducers as those need to
 * be handled differently in the default reducer
 */
const rootReducer = combineReducers({
  appRegistry,
  comments,
  autoPreview,
  dataService,
  fields,
  inputDocuments,
  namespace,
  env,
  isTimeSeries,
  serverVersion,
  savedPipeline,
  name,
  collationString,
  id,
  isModified,
  settings,
  limit,
  largeLimit,
  maxTimeMS,
  savingPipeline,
  editViewName,
  sourceName,
  outResultsFn,
  updateViewError,
  aggregation,
  workspace,
  countDocuments,
  aggregationWorkspaceId,
  isDataLake,
  pipelineBuilder,
  focusMode,
  sidePanel,
  collectionsFields,
  insights,
  searchIndexes,
});

export type RootAction =
  | AutoPreviewAction
  | FieldsAction
  | InputDocumentsAction
  | CollationStringAction
  | IdAction
  | SettingsAction
  | SavingPipelineAction
  | UpdateViewAction
  | AggregationActions
  | WorkspaceActions
  | CountDocumentsActions
  | PipelineBuilderAction
  | FocusModeAction
  | SidePanelAction
  | CollectionFieldsAction
  | InsightsAction
  | SearchIndexesAction
  | NewPipelineConfirmedAction
  | SavedPipelineAction
  | ClonePipelineAction
  | MaxTimeMSChangedAction;
export type RootState = ReturnType<typeof rootReducer>;
export type PipelineBuilderExtraArgs = {
  pipelineBuilder: PipelineBuilder;
  pipelineStorage: PipelineStorage;
  atlasService: AtlasService;
};

export type PipelineBuilderThunkDispatch<A extends Action = RootAction> =
  ThunkDispatch<RootState, PipelineBuilderExtraArgs, A>;

export type PipelineBuilderThunkAction<
  R,
  A extends Action = RootAction
> = ThunkAction<R, RootState, PipelineBuilderExtraArgs, A>;

export default rootReducer;

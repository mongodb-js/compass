import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
import dataService from './data-service';
import editViewName from './edit-view-name';
import sourceName from './source-name';
import pipelineBuilder from './pipeline-builder';
import inputDocuments from './input-documents';
import namespace from './namespace';
import env from './env';
import isTimeSeries from './is-time-series';
import serverVersion from './server-version';
import isModified from './is-modified';
import name from './name';
import limit from './limit';
import largeLimit from './large-limit';
import maxTimeMS from './max-time-ms';
import collationString from './collation-string';
import comments from './comments';
import autoPreview from './auto-preview';
import id from './id';
import savedPipeline from './saved-pipeline';
import settings from './settings';
import savingPipeline from './saving-pipeline';
import outResultsFn from './out-results-fn';
import updateViewError from './update-view';
import aggregation from './aggregation';
import countDocuments from './count-documents';
import isDataLake from './is-datalake';
import workspace from './workspace';
import aggregationWorkspaceId from './aggregation-workspace-id';
import collectionStats from './collection-stats';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { PipelineBuilder } from './pipeline-builder/pipeline-builder';
import type { PipelineStorage } from '@mongodb-js/my-queries-storage/provider';
import focusMode from './focus-mode';
import sidePanel from './side-panel';
import collectionsFields from './collections-fields';
import insights from './insights';
import searchIndexes from './search-indexes';
import type { WorkspacesService } from '@mongodb-js/compass-workspaces/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type AppRegistry from 'hadron-app-registry';
import type { AtlasAiService } from '@mongodb-js/compass-generative-ai/provider';
import type { MongoDBInstance } from 'mongodb-instance-model';
import type { DataService } from '../modules/data-service';
import type {
  ConnectionInfoRef,
  ConnectionScopedAppRegistry,
} from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
/**
 * The main application reducer.
 *
 * this does not include save state and restore state reducers as those need to
 * be handled differently in the default reducer
 */
const rootReducer = combineReducers({
  comments,
  autoPreview,
  dataService,
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
  collectionStats,
});

export type RootState = ReturnType<typeof rootReducer>;

export type PipelineBuilderExtraArgs = {
  globalAppRegistry: AppRegistry;
  localAppRegistry: AppRegistry;
  pipelineBuilder: PipelineBuilder;
  pipelineStorage: PipelineStorage;
  workspaces: WorkspacesService;
  preferences: PreferencesAccess;
  logger: Logger;
  track: TrackFunction;
  atlasAiService: AtlasAiService;
  instance: MongoDBInstance;
  dataService: DataService;
  connectionInfoRef: ConnectionInfoRef;
  connectionScopedAppRegistry: ConnectionScopedAppRegistry<
    'open-export' | 'view-edited' | 'agg-pipeline-out-executed'
  >;
};

export type PipelineBuilderThunkDispatch<A extends Action = AnyAction> =
  ThunkDispatch<RootState, PipelineBuilderExtraArgs, A>;

export type PipelineBuilderThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, PipelineBuilderExtraArgs, A>;

export default rootReducer;

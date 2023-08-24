import type { Action, AnyAction } from 'redux';
import { combineReducers } from 'redux';
import type { AtlasService } from '@mongodb-js/atlas-service/renderer';
import dataService from './data-service';
import fields from './fields';
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
import isAtlasDeployed from './is-atlas-deployed';
import maxTimeMS from './max-time-ms';
import collationString from './collation-string';
import comments from './comments';
import autoPreview from './auto-preview';
import id from './id';
import savedPipeline from './saved-pipeline';
import appRegistry from '@mongodb-js/mongodb-redux-common/app-registry';
import settings from './settings';
import savingPipeline from './saving-pipeline';
import outResultsFn from './out-results-fn';
import projections from './projections';
import updateViewError from './update-view';
import aggregation from './aggregation';
import countDocuments from './count-documents';
import isDataLake from './is-datalake';
import workspace from './workspace';
import aggregationWorkspaceId from './aggregation-workspace-id';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type { PipelineBuilder } from './pipeline-builder/pipeline-builder';
import type { PipelineStorage } from '../utils/pipeline-storage';
import focusMode from './focus-mode';
import sidePanel from './side-panel';
import collectionsFields from './collections-fields';
import insights from './insights';

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
  isAtlasDeployed,
  settings,
  limit,
  largeLimit,
  maxTimeMS,
  savingPipeline,
  projections,
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
});

export type RootState = ReturnType<typeof rootReducer>;
export type PipelineBuilderExtraArgs = {
  pipelineBuilder: PipelineBuilder;
  pipelineStorage: PipelineStorage;
  atlasService: AtlasService;
};

export type PipelineBuilderThunkDispatch<A extends Action = AnyAction> =
  ThunkDispatch<RootState, PipelineBuilderExtraArgs, A>;

export type PipelineBuilderThunkAction<
  R,
  A extends Action = AnyAction
> = ThunkAction<R, RootState, PipelineBuilderExtraArgs, A>;

export default rootReducer;

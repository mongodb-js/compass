import { combineReducers } from 'redux';
import type { AIPipelineAction } from './pipeline-ai';
import aiPipeline from './pipeline-ai';
import type { StageEditorAction } from './stage-editor';
import stageEditor from './stage-editor';
import type { TextEditorAction } from './text-editor-pipeline';
import pipeline from './text-editor-pipeline';
import type { PipelineModeAction } from './pipeline-mode';
import pipelineMode from './pipeline-mode';
import type { OutputStageAction } from './text-editor-output-stage';
import outputStage from './text-editor-output-stage';

export type PipelineBuilderAction =
  | AIPipelineAction
  | PipelineModeAction
  | StageEditorAction
  | TextEditorAction
  | OutputStageAction;

const reducer = combineReducers({
  aiPipeline,
  pipelineMode,
  stageEditor,
  textEditor: combineReducers({
    pipeline,
    outputStage,
  }),
});

export default reducer;

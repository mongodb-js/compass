import React from 'react';
import { GenerativeAIInput } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

import {
  changeAIPromptText,
  cancelAIPipelineGeneration,
  runAIPipelineGeneration,
} from '../../../modules/pipeline-builder/pipeline-ai';
import type { RootState } from '../../../modules';

const { log, mongoLogId, track } = createLoggerAndTelemetry('AI-PIPELINE-UI');

const onSubmitFeedback = (feedback: 'positive' | 'negative', text: string) => {
  log.info(mongoLogId(1_001_000_229), 'PipelineAI', 'AI pipeline feedback', {
    feedback,
    text,
  });

  track('PipelineAI Feedback', () => ({
    feedback,
    text,
  }));
};

type PipelineAIProps = Omit<
  React.ComponentProps<typeof GenerativeAIInput>,
  'onSubmitFeedback'
>;

function PipelineAI(props: PipelineAIProps) {
  return (
    <GenerativeAIInput
      onSubmitFeedback={onSubmitFeedback}
      placeholder="Tell Compass what aggregation to build (e.g. how many movies were made each year)"
      {...props}
    />
  );
}

const ConnectedPipelineAI = connect(
  (state: RootState) => {
    return {
      aiPromptText: state.pipelineBuilder.aiPipeline.aiPromptText,
      isFetching: state.pipelineBuilder.aiPipeline.status === 'fetching',
      didSucceed: state.pipelineBuilder.aiPipeline.status === 'success',
      errorMessage: state.pipelineBuilder.aiPipeline.errorMessage,
    };
  },
  {
    onChangeAIPromptText: changeAIPromptText,
    onCancelRequest: cancelAIPipelineGeneration,
    onSubmitText: runAIPipelineGeneration,
  }
)(PipelineAI);

export { ConnectedPipelineAI as PipelineAI };

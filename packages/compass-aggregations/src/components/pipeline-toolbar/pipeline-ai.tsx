import React, { useRef, useEffect } from 'react';
import { GenerativeAIInput } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { usePreference } from 'compass-preferences-model';

import {
  changeAIPromptText,
  cancelAIPipelineGeneration,
  runAIPipelineGeneration,
  resetIsAggregationGeneratedFromQuery,
  hideInput,
} from '../../modules/pipeline-builder/pipeline-ai';
import type { RootState } from '../../modules';

const { log, mongoLogId, track } = createLoggerAndTelemetry('AI-PIPELINE-UI');

const onSubmitFeedback = (feedback: 'positive' | 'negative', text: string) => {
  log.info(mongoLogId(1_001_000_232), 'PipelineAI', 'AI pipeline feedback', {
    feedback,
    text,
  });

  track('PipelineAI Feedback', () => ({
    feedback,
    text,
  }));
};

type PipelineAIProps = {
  isAIInputVisible: boolean;
  onHideAIInputClick(): void;
  aiPromptText: string;
  onChangeAIPromptText(val: string): void;
  onSubmitText(val: string): void;
  didSucceed: boolean;
  isFetching: boolean;
  errorMessage?: string;
  onCancelRequest(): void;
  isAggregationGeneratedFromQuery: boolean;
  onResetIsAggregationGeneratedFromQuery(): void;
};

export const PipelineAI: React.FunctionComponent<PipelineAIProps> = ({
  isAIInputVisible,
  onHideAIInputClick,
  aiPromptText,
  onChangeAIPromptText,
  onSubmitText,
  isFetching,
  didSucceed,
  onCancelRequest,
  errorMessage,
  isAggregationGeneratedFromQuery,
  onResetIsAggregationGeneratedFromQuery,
}) => {
  // Don't show the feedback options if telemetry is disabled.
  const enableTelemetry = usePreference('trackUsageStatistics', React);
  const onResetIsAggregationGeneratedFromQueryRef = useRef(
    onResetIsAggregationGeneratedFromQuery
  );

  useEffect(function () {
    return () => {
      onResetIsAggregationGeneratedFromQueryRef.current();
    };
  }, []);

  return (
    <GenerativeAIInput
      show={isAIInputVisible}
      onClose={onHideAIInputClick}
      aiPromptText={aiPromptText}
      onChangeAIPromptText={onChangeAIPromptText}
      onSubmitText={onSubmitText}
      isFetching={isFetching}
      didSucceed={didSucceed}
      onCancelRequest={onCancelRequest}
      errorMessage={errorMessage}
      isAggregationGeneratedFromQuery={isAggregationGeneratedFromQuery}
      onResetIsAggregationGeneratedFromQuery={
        onResetIsAggregationGeneratedFromQuery
      }
      placeholder="Tell Compass what aggregation to build (e.g. how many movies were made each year)"
      onSubmitFeedback={enableTelemetry ? onSubmitFeedback : undefined}
    />
  );
};

const ConnectedPipelineAI = connect(
  (state: RootState) => {
    return {
      isAIInputVisible: state.pipelineBuilder.aiPipeline.isInputVisible,
      isAggregationGeneratedFromQuery:
        state.pipelineBuilder.aiPipeline.isAggregationGeneratedFromQuery,
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
    onResetIsAggregationGeneratedFromQuery:
      resetIsAggregationGeneratedFromQuery,
    onHideAIInputClick: hideInput,
  }
)(PipelineAI);

export default ConnectedPipelineAI;

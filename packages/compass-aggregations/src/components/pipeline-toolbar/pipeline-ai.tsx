import React, { useRef, useEffect, useCallback } from 'react';
import { openToast } from '@mongodb-js/compass-components';
import { GenerativeAIInput } from '@mongodb-js/compass-generative-ai';
import { connect } from 'react-redux';
import { usePreference } from 'compass-preferences-model/provider';

import {
  changeAIPromptText,
  cancelAIPipelineGeneration,
  runAIPipelineGeneration,
  resetIsAggregationGeneratedFromQuery,
  hideInput,
} from '../../modules/pipeline-builder/pipeline-ai';
import type { RootState } from '../../modules';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { getPipelineStageOperatorsFromBuilderState } from '../../modules/pipeline-builder/builder-helpers';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { useConnectionInfoAccess } from '@mongodb-js/compass-connections/provider';

const useOnSubmitFeedback = (lastAIPipelineRequestId: string | null) => {
  const logger = useLogger('AI-PIPELINE-UI');
  const track = useTelemetry();
  const connectionInfoAccess = useConnectionInfoAccess();
  return useCallback(
    (feedback: 'positive' | 'negative', text: string) => {
      const { log, mongoLogId } = logger;
      log.info(
        mongoLogId(1_001_000_232),
        'PipelineAI',
        'AI pipeline feedback',
        {
          feedback,
          requestId: lastAIPipelineRequestId,
          text,
        }
      );

      track(
        'PipelineAI Feedback',
        () => ({
          feedback,
          request_id: lastAIPipelineRequestId,
          text,
        }),
        connectionInfoAccess.getCurrentConnectionInfo()
      );

      openToast('pipeline-ai-feedback-submitted', {
        variant: 'success',
        title: 'Your feedback has been submitted.',
        timeout: 10_000,
      });
    },
    [logger, track, lastAIPipelineRequestId, connectionInfoAccess]
  );
};

type PipelineAIProps = {
  isAIInputVisible: boolean;
  onHideAIInputClick(): void;
  aiPromptText: string;
  onChangeAIPromptText(val: string): void;
  onSubmitText(val: string): void;
  didGenerateEmptyResults: boolean;
  didSucceed: boolean;
  isFetching: boolean;
  errorMessage?: string;
  errorCode?: string;
  onCancelRequest(): void;
  isAggregationGeneratedFromQuery: boolean;
  lastAIPipelineRequestId: string | null;
  onResetIsAggregationGeneratedFromQuery(): void;
};

export const PipelineAI: React.FunctionComponent<PipelineAIProps> = ({
  isAIInputVisible,
  onHideAIInputClick,
  aiPromptText,
  onChangeAIPromptText,
  onSubmitText,
  isFetching,
  didGenerateEmptyResults,
  didSucceed,
  onCancelRequest,
  errorMessage,
  errorCode,
  isAggregationGeneratedFromQuery,
  lastAIPipelineRequestId,
  onResetIsAggregationGeneratedFromQuery,
}) => {
  // Don't show the feedback options if telemetry is disabled.
  const enableTelemetry = usePreference('trackUsageStatistics');
  const onResetIsAggregationGeneratedFromQueryRef = useRef(
    onResetIsAggregationGeneratedFromQuery
  );

  useEffect(function () {
    return () => {
      onResetIsAggregationGeneratedFromQueryRef.current();
    };
  }, []);
  const onSubmitFeedback = useOnSubmitFeedback(lastAIPipelineRequestId);

  return (
    <GenerativeAIInput
      show={isAIInputVisible}
      onClose={onHideAIInputClick}
      aiPromptText={aiPromptText}
      onChangeAIPromptText={onChangeAIPromptText}
      onSubmitText={onSubmitText}
      isFetching={isFetching}
      didGenerateEmptyResults={didGenerateEmptyResults}
      didSucceed={didSucceed}
      onCancelRequest={onCancelRequest}
      errorMessage={errorMessage}
      errorCode={errorCode}
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
      lastAIPipelineRequestId:
        state.pipelineBuilder.aiPipeline.lastAIPipelineRequestId,
      aiPromptText: state.pipelineBuilder.aiPipeline.aiPromptText,
      isFetching: state.pipelineBuilder.aiPipeline.status === 'fetching',
      didGenerateEmptyResults:
        state.pipelineBuilder.aiPipeline.status === 'success' &&
        getPipelineStageOperatorsFromBuilderState(state, false).length === 0,
      didSucceed: state.pipelineBuilder.aiPipeline.status === 'success',
      errorMessage: state.pipelineBuilder.aiPipeline.errorMessage,
      errorCode: state.pipelineBuilder.aiPipeline.errorCode,
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

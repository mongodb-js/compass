import React from 'react';
import { openToast } from '@mongodb-js/compass-components';
import { GenerativeAIInput } from '@mongodb-js/compass-generative-ai';
import { connect } from 'react-redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { usePreference } from 'compass-preferences-model';

import type { RootState } from '../stores/query-bar-store';
import {
  cancelAIQuery,
  changeAIPromptText,
  runAIQuery,
} from '../stores/ai-query-reducer';

const { log, mongoLogId, track } = createLoggerAndTelemetry('AI-QUERY-UI');

const onSubmitFeedback = (feedback: 'positive' | 'negative', text: string) => {
  log.info(mongoLogId(1_001_000_224), 'AIQuery', 'AI query feedback', {
    feedback,
    text,
  });

  track('AI Query Feedback', () => ({
    feedback,
    text,
  }));

  openToast('query-ai-feedback-submitted', {
    variant: 'success',
    title: 'Your feedback has been submitted.',
    timeout: 10_000,
  });
};

type QueryAIProps = Omit<
  React.ComponentProps<typeof GenerativeAIInput>,
  'onSubmitFeedback'
>;

function QueryAI(props: QueryAIProps) {
  // Don't show the feedback options if telemetry is disabled.
  const enableTelemetry = usePreference('trackUsageStatistics', React);

  return (
    <GenerativeAIInput
      onSubmitFeedback={enableTelemetry ? onSubmitFeedback : undefined}
      {...props}
    />
  );
}

const ConnectedQueryAI = connect(
  (state: RootState) => {
    return {
      aiPromptText: state.aiQuery.aiPromptText,
      isFetching: state.aiQuery.status === 'fetching',
      didSucceed: state.aiQuery.status === 'success',
      errorMessage: state.aiQuery.errorMessage,
      errorCode: state.aiQuery.errorCode,
    };
  },
  {
    onChangeAIPromptText: changeAIPromptText,
    onCancelRequest: cancelAIQuery,
    onSubmitText: runAIQuery,
  }
)(QueryAI);

export { ConnectedQueryAI as QueryAI };

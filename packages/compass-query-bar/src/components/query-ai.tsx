import React, { useCallback } from 'react';
import { openToast } from '@mongodb-js/compass-components';
import { GenerativeAIInput } from '@mongodb-js/compass-generative-ai';
import { connect } from '../stores/context';
import { usePreference } from 'compass-preferences-model';

import type { RootState } from '../stores/query-bar-store';
import {
  cancelAIQuery,
  changeAIPromptText,
  runAIQuery,
} from '../stores/ai-query-reducer';
import { useLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

const useOnSubmitFeedback = () => {
  const logger = useLoggerAndTelemetry('AI-QUERY-UI');
  return useCallback(
    (feedback: 'positive' | 'negative', text: string) => {
      const { log, mongoLogId, track } = logger;
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
    },
    [logger]
  );
};

type QueryAIProps = Omit<
  React.ComponentProps<typeof GenerativeAIInput>,
  'onSubmitFeedback'
>;

function QueryAI(props: QueryAIProps) {
  // Don't show the feedback options if telemetry is disabled.
  const enableTelemetry = usePreference('trackUsageStatistics');
  const onSubmitFeedback = useOnSubmitFeedback();

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

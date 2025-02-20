import React, { useCallback } from 'react';
import { openToast } from '@mongodb-js/compass-components';
import { GenerativeAIInput } from '@mongodb-js/compass-generative-ai';
import { connect } from '../stores/context';
import { usePreference } from 'compass-preferences-model/provider';

import type { RootState } from '../stores/query-bar-store';
import {
  cancelAIQuery,
  changeAIPromptText,
  runAIQuery,
} from '../stores/ai-query-reducer';
import { useLogger } from '@mongodb-js/compass-logging/provider';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { isEqualDefaultQuery } from '../utils/query';
import { useConnectionInfoRef } from '@mongodb-js/compass-connections/provider';

const useOnSubmitFeedback = (lastAIQueryRequestId: string | null) => {
  const logger = useLogger('AI-QUERY-UI');
  const track = useTelemetry();
  const connectionInfoRef = useConnectionInfoRef();
  return useCallback(
    (feedback: 'positive' | 'negative', text: string) => {
      const { log, mongoLogId } = logger;
      log.info(mongoLogId(1_001_000_224), 'AIQuery', 'AI query feedback', {
        feedback,
        requestId: lastAIQueryRequestId,
        text,
      });

      track(
        'AI Query Feedback',
        () => ({
          feedback,
          text,
          request_id: lastAIQueryRequestId,
        }),
        connectionInfoRef.current
      );

      openToast('query-ai-feedback-submitted', {
        variant: 'success',
        title: 'Your feedback has been submitted.',
        timeout: 10_000,
      });
    },
    [logger, lastAIQueryRequestId, track, connectionInfoRef]
  );
};

type QueryAIProps = Omit<
  React.ComponentProps<typeof GenerativeAIInput>,
  'onSubmitFeedback'
> & {
  lastAIQueryRequestId: string | null;
};

function QueryAI(props: QueryAIProps) {
  // Don't show the feedback options if telemetry is disabled.
  const enableTelemetry = usePreference('trackUsageStatistics');
  const onSubmitFeedback = useOnSubmitFeedback(props.lastAIQueryRequestId);

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
      lastAIQueryRequestId: state.aiQuery.lastAIQueryRequestId,
      didGenerateEmptyResults:
        state.aiQuery.status === 'success' &&
        isEqualDefaultQuery(state.queryBar.fields),
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

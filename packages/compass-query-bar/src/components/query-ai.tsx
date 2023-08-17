import React from 'react';
import { GenerativeAIInput } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

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
};

type QueryAIProps = Omit<
  React.ComponentProps<typeof GenerativeAIInput>,
  'onSubmitFeedback'
>;

function QueryAI(props: QueryAIProps) {
  return <GenerativeAIInput onSubmitFeedback={onSubmitFeedback} {...props} />;
}

const ConnectedQueryAI = connect(
  (state: RootState) => {
    return {
      aiPromptText: state.aiQuery.aiPromptText,
      isFetching: state.aiQuery.status === 'fetching',
      didSucceed: state.aiQuery.status === 'success',
      errorMessage: state.aiQuery.errorMessage,
    };
  },
  {
    onChangeAIPromptText: changeAIPromptText,
    onCancelRequest: cancelAIQuery,
    onSubmitText: runAIQuery,
  }
)(QueryAI);

export { ConnectedQueryAI as QueryAI };

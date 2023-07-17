import {
  Button,
  CancelLoader,
  ErrorSummary,
  css,
} from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../../stores/query-bar-store';
import {
  runAISuggestions,
  cancelAISuggestions,
} from '../../stores/suggestions-reducer';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const suggestionStyles = css({});

function QuerySuggestions({
  onClickGenerateSuggestions,
  onClickCancel,
  // didSucceed,
  errorMessage,
  suggestions,
  isFetching,
}: {
  onClickGenerateSuggestions: () => void;
  onClickCancel: () => void;
  isFetching?: boolean;
  didSucceed: boolean;
  errorMessage?: string;
  suggestions: string[];
}) {
  return (
    <div className={containerStyles}>
      {/* {didSucceed && (
        <div
      )} */}
      {suggestions.map((suggestion) => (
        <div className={suggestionStyles} key={suggestion}>
          {/* TODO: Make these clickable. */}
          {suggestion}
        </div>
      ))}
      {errorMessage && <ErrorSummary errors={errorMessage} />}
      <div>
        {/* TODO: Eventually we don't want this as a button,
        instead auto generate on ai expand? */}
        {isFetching ? (
          <CancelLoader
            progressText="Generating Suggestions"
            cancelText="Stop"
            onCancel={onClickCancel}
          />
        ) : (
          <Button onClick={onClickGenerateSuggestions} disabled={isFetching}>
            Generate Suggestions
          </Button>
        )}
      </div>
    </div>
  );
}

const ConnectedQuerySuggestions = connect(
  (state: RootState) => ({
    suggestions: state.suggestions.suggestions,
    isFetching: state.suggestions.status === 'fetching',
    didSucceed: state.suggestions.status === 'success',
    errorMessage: state.suggestions.errorMessage,
  }),
  {
    onClickGenerateSuggestions: runAISuggestions,
    onClickCancel: cancelAISuggestions,
  }
)(QuerySuggestions);

export { ConnectedQuerySuggestions as QuerySuggestions };

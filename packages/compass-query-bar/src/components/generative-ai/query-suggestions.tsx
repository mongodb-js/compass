import {
  CancelLoader,
  ErrorSummary,
  Link,
  css,
  focusRing,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import React from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../../stores/query-bar-store';
import {
  runAISuggestions,
  cancelAISuggestions,
  applySuggestion,
} from '../../stores/suggestions-reducer';
import type { BaseQuery } from '../../constants/query-properties';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
});

const suggestionStyles = css({});

// TODO: don't duplicate this.
const buttonResetStyles = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
});

const generateButtonStyles = css(buttonResetStyles, {
  //
});

const suggestionButtonStyles = css(
  buttonResetStyles,
  {
    padding: spacing[1],

    // Maybe todo:
    // display: 'inline-grid',

    display: 'flex',
    textAlign: 'left',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    justifyContent: 'left',

    width: '100%',
    '&:hover': {
      // TODO: Darkmode.
      backgroundColor: palette.gray.light3,
    },
  },
  focusRing
);

const suggestionTextStyles = css({
  // flexGrow: 1,
  fontWeight: 'bold',
  textOverflow: 'ellipsis', // todo
});

const suggestionDescriptionStyles = css({
  // maxWidth:
  // TODO: darkmode styles
  color: palette.gray.light1,
  marginLeft: spacing[1],
  textOverflow: 'ellipsis', // todo
});

function Suggestion({
  query,
  text,
  onClick,
}: {
  query: BaseQuery;
  text: string;
  onClick: (query: BaseQuery) => void;
}) {
  return (
    <li className={suggestionStyles} aria-label={text}>
      <button
        className={suggestionButtonStyles}
        onClick={() => onClick(query)}
        title={text}
      >
        <span className={suggestionTextStyles}>{text}</span>
        <span className={suggestionDescriptionStyles}>
          {JSON.stringify(query)}
        </span>
      </button>
    </li>
  );
}

function QuerySuggestions({
  onClickGenerateSuggestions,
  onClickCancel,
  onClickApply,
  errorMessage,
  suggestions,
  isFetching,
}: {
  onClickGenerateSuggestions: () => void;
  onClickCancel: () => void;
  onClickApply: (query: BaseQuery) => void;
  isFetching?: boolean;
  didSucceed: boolean;
  errorMessage?: string;
  suggestions: {
    text: string;
    query: BaseQuery;
  }[];
}) {
  return (
    <div className={containerStyles}>
      {/* {didSucceed && (
        <div
      )} */}
      <ul
      // TODO: Should we have a specific `role` set here?
      >
        {suggestions.map(({ text, query }) => (
          <Suggestion
            key={text}
            text={text}
            query={query}
            onClick={onClickApply}
          />
        ))}
      </ul>
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
          <Link
            className={generateButtonStyles}
            as="button"
            arrowAppearance="none"
            hideExternalIcon
            onClick={onClickGenerateSuggestions}
            disabled={isFetching}
          >
            Generate Suggestions
          </Link>
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
    onClickApply: applySuggestion,
    onClickGenerateSuggestions: runAISuggestions,
    onClickCancel: cancelAISuggestions,
  }
)(QuerySuggestions);

export { ConnectedQuerySuggestions as QuerySuggestions };

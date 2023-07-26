import {
  Body,
  Button,
  CancelLoader,
  ErrorSummary,
  Icon,
  IconButton,
  Overline,
  css,
  cx,
  focusRing,
  palette,
  spacing,
  useDarkMode,
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
  // padding: spacing[3],
  marginTop: spacing[2],
  display: 'flex',
  gap: spacing[2],
  flexDirection: 'column',
});

const containerDarkModeStyles = css({
  backgroundColor: palette.black,
});

const overlineContainerStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const overlineStyles = css({
  color: palette.green.base,
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

const generateButtonStyles = css({
  display: 'block',
  //
});

// const generateButtonStyles = css(buttonResetStyles, {
//   //
// });

const suggestionButtonStyles = css(
  buttonResetStyles,
  {
    padding: `${spacing[1]}px ${spacing[2]}px`,
    borderRadius: spacing[1],

    // Maybe todo:
    // display: 'inline-grid',

    display: 'flex',
    gap: spacing[2],
    textAlign: 'left',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    justifyContent: 'left',

    width: '100%',
    '&:hover': {
      backgroundColor: palette.gray.dark3,
      cursor: 'pointer',
    },
  },
  focusRing
);

const suggestionTextStyles = css({
  //
});

const suggestionDescriptionStyles = css({
  // maxWidth:
  // TODO: darkmode styles
  color: palette.gray.base,
  // marginLeft: spacing[1],
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
        <Body as="span" className={suggestionTextStyles}>
          {text}
        </Body>
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
  const darkMode = useDarkMode();

  return (
    // <LeafyGreenProvider darkMode>
    <div className={cx(containerStyles, darkMode && containerDarkModeStyles)}>
      {suggestions.length > 0 ? (
        <div className={overlineContainerStyles}>
          <Overline className={overlineStyles}>Suggested Prompts</Overline>

          <IconButton
            // className={generateButtonStyles}
            // arrowAppearance="none"
            aria-label="Regenerate Suggestions"
            title="Regenerate Suggestions"
            // hideExternalIcon
            onClick={onClickGenerateSuggestions}
            disabled={isFetching}
          >
            <Icon glyph="Refresh" />
          </IconButton>
          {/* <Link
            className={generateButtonStyles}
            as="button"
            arrowAppearance="none"
            aria-label="Regenerate Suggestions"
            title="Regenerate Suggestions"
            hideExternalIcon
            onClick={onClickGenerateSuggestions}
            disabled={isFetching}
          >
            <Icon glyph="Refresh" />
          </Link> */}
        </div>
      ) : (
        // <Link
        //   className={generateButtonStyles}
        //   as="button"
        //   arrowAppearance="none"
        //   hideExternalIcon
        //   onClick={onClickGenerateSuggestions}
        //   disabled={isFetching}
        // >
        //   Generate Suggestions
        // </Link>
        <Button
          className={generateButtonStyles}
          size="extra-small"
          // as="button"
          // arrowAppearance="none"
          // hideExternalIcon
          onClick={onClickGenerateSuggestions}
          disabled={isFetching}
        >
          Generate Suggestions
        </Button>
      )}
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
        {isFetching && (
          <CancelLoader
            progressText="Generating Suggestions"
            cancelText="Stop"
            onCancel={onClickCancel}
          />
        )}
      </div>
    </div>
    // </LeafyGreenProvider>
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

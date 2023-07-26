import {
  Body,
  Button,
  ErrorSummary,
  Icon,
  IconButton,
  Overline,
  SpinLoader,
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
  color: palette.green.dark2,
});

const overlineDarkModeStyles = css({
  color: palette.green.base,
});

const suggestionsContainerStyles = css({
  // margin: 0,
  // padding: 0,
  marginTop: -spacing[2],
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
  // margin: 0,
  // padding: `${spacing[1]}px ${spacing[2]}px`,
  // padding: `${0}px ${spacing[2]}px`,
  // padding: spacing[1],
  // display: 'block',
  //
  marginRight: spacing[2],
});

const cancelButtonStyles = css({
  margin: `${0}px ${spacing[2]}px`,
});

// const generateButtonStyles = css(buttonResetStyles, {
//   //
// });

const suggestionButtonStyles = css(
  buttonResetStyles,
  {
    padding: `${spacing[1]}px ${spacing[1]}px`,
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
      backgroundColor: palette.gray.light2,
      cursor: 'pointer',
    },
  },
  focusRing
);

const regenerateButtonStyles = css({
  marginTop: -spacing[2],
  marginBottom: -spacing[2],
  // margin: 0,
});

const suggestionDarkModeButtonStyles = css({
  '&:hover': {
    backgroundColor: palette.gray.dark3,
  },
});

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
  const darkMode = useDarkMode();

  return (
    <li className={suggestionStyles} aria-label={text}>
      <button
        className={cx(
          suggestionButtonStyles,
          darkMode && suggestionDarkModeButtonStyles
        )}
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
      {suggestions?.length > 0 ? (
        <div className={overlineContainerStyles}>
          <Overline
            className={cx(overlineStyles, darkMode && overlineDarkModeStyles)}
          >
            Suggested Prompts
          </Overline>

          {isFetching ? (
            <>
              <SpinLoader />
              <Button
                className={cancelButtonStyles}
                size="xsmall"
                onClick={onClickCancel}
              >
                Cancel
              </Button>
            </>
          ) : (
            <IconButton
              className={regenerateButtonStyles}
              aria-label="Regenerate Suggestions"
              title="Regenerate Suggestions"
              onClick={onClickGenerateSuggestions}
            >
              <Icon glyph="Refresh" />
            </IconButton>
          )}
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
        <div>
          <Button
            className={generateButtonStyles}
            size="xsmall"
            onClick={onClickGenerateSuggestions}
            disabled={isFetching}
          >
            Generate Suggestions
          </Button>
          {isFetching && (
            <>
              <SpinLoader />
              <Button
                className={cancelButtonStyles}
                size="xsmall"
                onClick={onClickCancel}
              >
                Cancel
              </Button>
            </>
          )}

          {/* <Button
              className={cancelButtonStyles}
              size="xsmall"
              onClick={onClickCancel}
            >
              Cancel
            </Button> */}
        </div>
      )}
      {!isFetching && suggestions?.length > 0 && (
        <ul
          className={suggestionsContainerStyles}
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
      )}
      {errorMessage && <ErrorSummary errors={errorMessage} />}
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

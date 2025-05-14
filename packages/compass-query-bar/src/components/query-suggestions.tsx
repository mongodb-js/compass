import {
  Body,
  Button,
  ErrorSummary,
  Icon,
  IconButton,
  InteractivePopover,
  Overline,
  Placeholder,
  SpinLoader,
  css,
  cx,
  focusRing,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useCallback, useEffect } from 'react';
// import { connect } from 'react-redux';

import { connect } from '../stores/context';
import type { RootState } from '../stores/query-bar-store';
import {
  runAISuggestions,
  cancelAISuggestions,
  applySuggestion,
} from '../stores/suggestions-reducer';
import type { BaseQuery } from '../constants/query-properties';

const containerStyles = css({
  padding: spacing[200],
  // marginTop: spacing[2],
  display: 'flex',
  gap: spacing[200],
  flexDirection: 'column',
  flexGrow: 1,
  width: '800px',
  minHeight: spacing[800] * 2,
  maxHeight: '50vh',
  textAlign: 'left',
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
  // marginTop: -spacing[2],
  textAlign: 'left',
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

// const generateButtonStyles = css({
//   // margin: 0,
//   // padding: `${spacing[1]}px ${spacing[2]}px`,
//   // padding: `${0}px ${spacing[2]}px`,
//   // padding: spacing[1],
//   // display: 'block',
//   //
//   marginRight: spacing[2],
// });

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

const loaderContainer = css({
  display: 'flex',
  gap: spacing[200],
  flexDirection: 'column',
  flexGrow: 1,
  width: '800px',
  minHeight: spacing[800] * 2,
  maxHeight: '50vh',
  justifyContent: 'left',
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
  isDisabled,
  onClick,
}: {
  isDisabled?: boolean;
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
        disabled={isDisabled}
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

const popoverStyles = css({
  // We want the popover to open almost to the shell at the bottom of Compass.
  maxHeight: 'calc(100vh - 260px)',
  // width: 'calc(100vw - 260px)',
  // width: '500px',
  display: 'flex',
  // marginLeft: -spacing[2] - 1, // Align to the left of the bar.
  // marginTop: spacing[1],
  position: 'fixed',
});

const placeholderStyles = css({
  marginTop: spacing[1],
  float: 'left',
  justifySelf: 'flex-start',
  alignSelf: 'flex-start',
});

function QuerySuggestions({
  onClickGenerateSuggestions,
  onClickCancel,
  onClickApply: _onClickApply,
  errorMessage,
  suggestions,
  isFetching,
  setShowSuggestions: _setShowSuggestions,
  show,
}: {
  onClickGenerateSuggestions: () => void;
  onClickCancel: () => void;
  onClickApply: (query: BaseQuery) => void;
  isFetching?: boolean;
  didSucceed: boolean;
  errorMessage?: string;
  setShowSuggestions: (show: boolean) => void;
  show: boolean;
  suggestions: {
    text: string;
    query: BaseQuery;
  }[];
}) {
  const setShowSuggestions = useCallback(
    (show: boolean) => {
      _setShowSuggestions(show);
    },
    [_setShowSuggestions]
  );

  const darkMode = useDarkMode();

  const onClickApply = useCallback(
    (query: BaseQuery) => {
      // TODO: move show suggestions to store.
      setShowSuggestions(false);
      _onClickApply(query);
    },
    [_onClickApply, setShowSuggestions]
  );

  useEffect(() => {
    if (show && suggestions.length === 0 && !isFetching && !errorMessage) {
      onClickGenerateSuggestions();
    }
  }, [show, onClickGenerateSuggestions, isFetching, suggestions, errorMessage]);

  // if (!show) {
  //   return null;
  // }

  const containedElements = [
    '[data-id="ai-user-text-input"]',
    '[data-id="ai-suggestions-content"]',
  ];

  return (
    <InteractivePopover
      containedElements={containedElements}
      className={popoverStyles}
      open={show}
      dontFocusTrap // todo
      trigger={({ children, ref }) => {
        return (
          <div>
            {/* TODO: forced button ref */}
            <div ref={ref as any}></div>
            {children}
          </div>
        );
      }}
      setOpen={setShowSuggestions}
    >
      <div
        data-id="ai-suggestions-content"
        className={cx(containerStyles, darkMode && containerDarkModeStyles)}
      >
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
            {/* <Button
              className={generateButtonStyles}
              size="xsmall"
              onClick={onClickGenerateSuggestions}
              disabled={isFetching}
            >
              Generate Suggestions
            </Button> */}
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
        {isFetching && (
          // TODO: not hacky loop
          <div className={loaderContainer}>
            {[1, 2, 3].map((index) => (
              <Placeholder
                className={placeholderStyles}
                minChar={40}
                key={index}
              />
            ))}
          </div>
        )}
        {!isFetching && suggestions?.length > 0 && (
          // {suggestions?.length > 0 && (
          <ul
            className={suggestionsContainerStyles}
            // TODO: Should we have a specific `role` set here?
          >
            {suggestions.map(({ text, query }) => (
              <Suggestion
                key={text}
                // isDisabled={isFetching && index === suggestions.length - 1}
                text={text}
                query={query}
                onClick={onClickApply}
              />
            ))}
          </ul>
        )}
        {errorMessage && <ErrorSummary errors={errorMessage} />}
      </div>
    </InteractivePopover>
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

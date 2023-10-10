import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Banner,
  BannerVariant,
  Button,
  Icon,
  IconButton,
  SpinLoader,
  TextInput,
  css,
  cx,
  focusRing,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

import { DEFAULT_AI_ENTRY_SIZE } from './ai-entry-svg';
import { AIFeedback } from './ai-feedback';
import { AIGuideCue } from './ai-guide-cue';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
});

const inputBarContainerStyles = css({
  paddingTop: spacing[2],
  gap: spacing[2],
  flexGrow: 1,
  display: 'flex',
});

const inputContainerStyles = css({
  display: 'flex',
  flexGrow: 1,
  position: 'relative',
});

const textInputStyles = css({
  flexGrow: 1,
  // Override LeafyGreen input's padding to space for our robot.
  input: {
    paddingLeft: spacing[5],
    paddingRight: spacing[6] * 2 + spacing[2],
  },
});

const errorSummaryContainer = css({
  marginTop: spacing[1],
});

const floatingButtonsContainerStyles = css({
  position: 'absolute',
  right: spacing[1],
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
  // Match the whole textbox.
  height: spacing[4] + spacing[1],
});

const successIndicatorDarkModeStyles = css({
  color: palette.gray.dark3,
  backgroundColor: palette.green.base,
  borderRadius: '50%',
});

const successIndicatorLightModeStyles = css({
  color: palette.white,
  backgroundColor: palette.green.dark1,
  borderRadius: '50%',
});

const generateButtonStyles = css({
  border: 'none',
  height: spacing[4] - spacing[1],
  display: 'flex',
  fontSize: '12px',
  borderRadius: spacing[1],
});

const generateButtonLightModeStyles = css({
  backgroundColor: palette.gray.light2,
});

const highlightSize = 14;

const buttonHighlightStyles = css({
  // Custom button styles.
  height: `${highlightSize}px`,
  lineHeight: `${highlightSize}px`,
  padding: `0px ${spacing[1]}px`,
  borderRadius: '2px',
});

const buttonHighlightDarkModeStyles = css({
  backgroundColor: palette.gray.dark1,
  color: palette.gray.light1,
});

const buttonHighlightLightModeStyles = css({
  backgroundColor: palette.gray.light1,
  color: palette.gray.dark1,
});

const loaderContainerStyles = css({
  padding: spacing[1],
  display: 'inline-flex',
  width: DEFAULT_AI_ENTRY_SIZE + spacing[2],
  justifyContent: 'space-around',
});

const buttonResetStyles = css({
  margin: 0,
  padding: 0,
  border: 'none',
  background: 'none',
  cursor: 'pointer',
});

const closeAIButtonStyles = css(buttonResetStyles, focusRing, {
  height: spacing[4] + spacing[1],
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing[1]}px ${spacing[2]}px`,
  position: 'absolute',
});

const aiEntryContainerStyles = css({
  display: 'flex',
});

const closeText = 'Close AI Helper';

const SubmitArrowSVG = ({ darkMode }: { darkMode?: boolean }) => (
  <svg
    width={highlightSize}
    height={highlightSize}
    viewBox="0 0 14 14"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      width="14"
      height="14"
      rx="2"
      fill={darkMode ? palette.gray.dark1 : palette.gray.light1}
    />
    <path
      d="M5.24984 6.41668L2.9165 8.75001M2.9165 8.75001L5.24984 11.0833M2.9165 8.75001H9.33317C9.95201 8.75001 10.5455 8.50418 10.9831 8.06659C11.4207 7.62901 11.6665 7.03552 11.6665 6.41668C11.6665 5.79784 11.4207 5.20435 10.9831 4.76676C10.5455 4.32918 9.95201 4.08334 9.33317 4.08334H8.74984"
      stroke={darkMode ? palette.gray.light1 : palette.gray.dark1}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type GenerativeAIInputProps = {
  aiPromptText: string;
  didSucceed: boolean;
  errorMessage?: string;
  errorCode?: string;
  isFetching?: boolean;
  placeholder?: string;
  show: boolean;
  isAggregationGeneratedFromQuery?: boolean;
  onResetIsAggregationGeneratedFromQuery?: () => void;
  onCancelRequest: () => void;
  onChangeAIPromptText: (text: string) => void;
  onClose: () => void;
  onSubmitText: (text: string) => void;
  onSubmitFeedback?: (
    feedback: 'positive' | 'negative',
    feedbackText: string
  ) => void;
};

function GenerativeAIInput({
  aiPromptText,
  didSucceed,
  errorMessage,
  errorCode,
  isFetching,
  placeholder = 'Tell Compass what documents to find (e.g. which movies were released in 2000)',
  show,
  onCancelRequest,
  onClose,
  onChangeAIPromptText,
  onSubmitFeedback,
  onSubmitText,
  isAggregationGeneratedFromQuery = false,
  onResetIsAggregationGeneratedFromQuery,
}: GenerativeAIInputProps) {
  const promptTextInputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const darkMode = useDarkMode();
  const guideCueRef = useRef<HTMLInputElement>(null);

  const onTextInputKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        if (!aiPromptText) {
          return;
        }
        onSubmitText(aiPromptText);
      } else if (evt.key === 'Escape') {
        isFetching ? onCancelRequest() : onClose();
      }
    },
    [aiPromptText, onClose, onSubmitText, isFetching, onCancelRequest]
  );

  useEffect(() => {
    if (didSucceed) {
      setShowSuccess(true);

      const timeoutId = setTimeout(() => {
        setShowSuccess(false);
      }, 1500);

      return () => clearTimeout(timeoutId);
    }
  }, [didSucceed]);

  useEffect(() => {
    if (show) {
      promptTextInputRef.current?.focus();
    }
  }, [show]);

  const onCancelRequestRef = useRef(onCancelRequest);
  onCancelRequestRef.current = onCancelRequest;

  useEffect(() => {
    // When unmounting, ensure we cancel any ongoing requests.
    return () => onCancelRequestRef.current?.();
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className={containerStyles}>
      <div className={inputBarContainerStyles}>
        <div className={inputContainerStyles}>
          <TextInput
            className={textInputStyles}
            ref={promptTextInputRef}
            sizeVariant="small"
            data-testid="ai-user-text-input"
            aria-label="Enter a plain text query that the AI will translate into MongoDB query language."
            placeholder={placeholder}
            value={aiPromptText}
            onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
              onChangeAIPromptText(evt.currentTarget.value)
            }
            onKeyDown={onTextInputKeyDown}
          />
          <div className={floatingButtonsContainerStyles}>
            {isFetching ? (
              <div className={loaderContainerStyles}>
                <SpinLoader />
              </div>
            ) : showSuccess ? (
              <div className={loaderContainerStyles}>
                <Icon
                  className={
                    darkMode
                      ? successIndicatorDarkModeStyles
                      : successIndicatorLightModeStyles
                  }
                  glyph="CheckmarkWithCircle"
                />
              </div>
            ) : (
              <>
                {aiPromptText && (
                  <IconButton
                    aria-label="Clear prompt"
                    onClick={() => onChangeAIPromptText('')}
                    data-testid="ai-text-clear-prompt"
                  >
                    <Icon glyph="X" />
                  </IconButton>
                )}
              </>
            )}
            <Button
              size="small"
              className={cx(
                generateButtonStyles,
                !darkMode && generateButtonLightModeStyles
              )}
              disabled={!aiPromptText}
              data-testid="ai-generate-button"
              onClick={() =>
                isFetching ? onCancelRequest() : onSubmitText(aiPromptText)
              }
            >
              {isFetching ? (
                <>
                  <div>Cancel</div>
                  <span
                    className={cx(
                      buttonHighlightStyles,
                      darkMode
                        ? buttonHighlightDarkModeStyles
                        : buttonHighlightLightModeStyles
                    )}
                  >
                    esc
                  </span>
                </>
              ) : (
                <>
                  <div>Generate</div>
                  <SubmitArrowSVG darkMode={darkMode} />
                </>
              )}
            </Button>
          </div>
          <button
            className={closeAIButtonStyles}
            data-testid="close-ai-button"
            aria-label={closeText}
            title={closeText}
            onClick={() => onClose()}
          >
            <AIGuideCue
              showGuideCue={isAggregationGeneratedFromQuery}
              onCloseGuideCue={() => {
                onResetIsAggregationGeneratedFromQuery?.();
              }}
              refEl={guideCueRef}
              title="Aggregation generated"
              description="Your query requires stages from MongoDB's aggregation framework. Continue to work on it in our Aggregation Pipeline Builder"
            />
            <span className={aiEntryContainerStyles} ref={guideCueRef}>
              <Icon glyph="Sparkle" />
            </span>
          </button>
        </div>
        {didSucceed && onSubmitFeedback && (
          <AIFeedback onSubmitFeedback={onSubmitFeedback} />
        )}
      </div>
      {errorMessage && (
        <div className={errorSummaryContainer}>
          <Banner data-testid="ai-error-msg" variant={BannerVariant.Danger}>
            <AIError errorCode={errorCode} errorMessage={errorMessage} />
          </Banner>
        </div>
      )}
    </div>
  );
}

const AIError = ({
  errorCode,
  errorMessage,
}: {
  errorCode?: string;
  errorMessage: string;
}) => {
  // NOTE: this error is not coming from the HTTP endpoint.
  if (!errorCode) {
    return <>{errorMessage}</>;
  }

  // NOTE: this should never happen in Data Explorer as the frontend update would happen
  // in coordination with the api changes.
  if (errorCode === 'NOT_SUPPORTED') {
    return (
      <>
        Sorry, this version of Compass is no longer suitable to generate
        queries. Please update to the latest version to access all the features.
      </>
    );
  }

  if (errorCode === 'USER_INPUT_TOO_LONG') {
    return (
      <>
        Looks like your input exceeds the allowed length. Please reduce it and
        submit your prompt again.
      </>
    );
  }

  if (errorCode === 'PROMPT_TOO_LONG') {
    // TODO: https://jira.mongodb.org/browse/COMPASS-6866,
    // the following errors are probably better handled at service or backend level, by retrying the
    // call without the schema and additional parameters, since users are not
    // able to fix the issue on their own it cases where the schema is too big.
    return (
      <>
        Sorry, your collections have too many fields to process. Please try
        using this feature on a collection with smaller documents.
      </>
    );
  }

  if (errorCode === 'TOO_MANY_REQUESTS') {
    return (
      <>
        Sorry, we are receiving too many requests in a short period of time.
        Please wait a few minutes and try again.
      </>
    );
  }

  if (errorCode === 'GATEWAY_TIMEOUT') {
    return (
      <>
        It took too long to generate your query, please check your connection
        and try again. If the problem persists, contact our support team.
      </>
    );
  }

  // We received an errorCode that is not actionable (INTERNAL_SERVER_ERROR, QUERY_GENERATION_FAILED), or unknown.
  return (
    <>
      Sorry, we were unable to generate the query, please try again. If the
      error persists, try changing your prompt.
    </>
  );
};

export { GenerativeAIInput };

import {
  Button,
  Disclaimer,
  FeedbackPopover,
  Icon,
  css,
  spacing,
  cx,
  keyframes,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useEffect, useRef, useState } from 'react';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { log, mongoLogId, track } = createLoggerAndTelemetry('AI-QUERY-UI');

const suggestionActionButtonStyles = css({
  flexShrink: 0,
  display: 'flex',
  gap: spacing[2],
});

const fadeOutAnimationTimeMS = 2000;

const fadeOutWidthAnimation = keyframes({
  '0%': {
    width: spacing[7],
  },
  '90%': {
    width: spacing[7],
  },
  '100%': {
    width: 0,
  },
});

const feedbackSubmittedStyles = css({
  overflow: 'hidden',
  animation: `${fadeOutWidthAnimation} ${fadeOutAnimationTimeMS}ms ease-in`,
  width: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
});

const submittedDarkStyles = css({
  color: palette.green.light1,
});

const submittedLightStyles = css({
  color: palette.green.dark1,
});

const feedbackButtonLightStyles = css({
  // TODO(LG-3497): We fill the icon colors here as there is a bug
  // with the LeafyGreen ThumbsUp and ThumbsDown icon fills.
  fill: palette.gray.dark1,
});

const feedbackButtonDarkStyles = css({
  // TODO(LG-3497): We fill the icon colors here as there is a bug
  // with the LeafyGreen ThumbsUp and ThumbsDown icon fills.
  fill: palette.gray.light1,
});

const buttonActivePositiveStyles = css({
  backgroundColor: palette.green.light3,
  borderColor: palette.green.dark1,
  fill: palette.green.dark1,
});

const buttonActiveNegativeStyles = css({
  backgroundColor: palette.red.light3,
  borderColor: palette.red.dark2,
  fill: palette.red.dark2,
});

function QueryFeedback() {
  const darkMode = useDarkMode();

  const feedbackPositiveButtonRef = useRef<HTMLInputElement>(null);
  const feedbackNegativeButtonRef = useRef<HTMLInputElement>(null);

  const [chosenFeedbackOption, setChosenFeedbackOption] = useState<
    'none' | 'positive' | 'negative'
  >('none');

  const [didSubmit, setDidSubmit] = useState(false);
  const [enableShowFeedbackSuccess, setEnableShowFeedbackSuccess] =
    useState(true);

  const onSubmitFeedback = (text: string) => {
    log.info(mongoLogId(1_001_000_223), 'AIQuery', 'AI query feedback', {
      feedback: chosenFeedbackOption,
      text,
    });

    track('AIQuery Feedback', () => ({
      feedback: chosenFeedbackOption,
      text,
    }));
    setDidSubmit(true);
  };

  useEffect(() => {
    if (didSubmit) {
      const timeoutId = setTimeout(() => {
        setEnableShowFeedbackSuccess(false);
      }, fadeOutAnimationTimeMS);
      return () => {
        clearTimeout(timeoutId);
      };
    }
  }, [didSubmit]);

  if (didSubmit) {
    if (!enableShowFeedbackSuccess) {
      return null;
    }

    return (
      <div className={feedbackSubmittedStyles}>
        <Disclaimer
          className={darkMode ? submittedDarkStyles : submittedLightStyles}
        >
          Success!
        </Disclaimer>
      </div>
    );
  }

  return (
    <div className={suggestionActionButtonStyles}>
      <Button
        className={cx(
          darkMode ? feedbackButtonDarkStyles : feedbackButtonLightStyles,
          chosenFeedbackOption === 'positive' && buttonActivePositiveStyles
        )}
        onClick={() => setChosenFeedbackOption('positive')}
        size="small"
        data-testid="ai-query-feedback-thumbs-up"
        ref={feedbackPositiveButtonRef}
      >
        <Icon glyph="ThumbsUp" />
      </Button>

      <Button
        className={cx(
          darkMode ? feedbackButtonDarkStyles : feedbackButtonLightStyles,
          chosenFeedbackOption === 'negative' && buttonActiveNegativeStyles
        )}
        onClick={() => setChosenFeedbackOption('negative')}
        size="small"
        ref={feedbackNegativeButtonRef}
      >
        <Icon glyph="ThumbsDown" />
      </Button>

      {/**
       * We use the LGGuideCue instead of Compass' GuideCue here because
       * this usage isn't the typical show-one-time guide cue.
       */}
      {chosenFeedbackOption !== 'none' && (
        <FeedbackPopover
          refEl={
            chosenFeedbackOption === 'positive'
              ? feedbackPositiveButtonRef
              : feedbackNegativeButtonRef
          }
          open
          setOpen={() => setChosenFeedbackOption('none')}
          onSubmitFeedback={onSubmitFeedback}
          label="Provide Feedback"
          placeholder={
            chosenFeedbackOption === 'positive'
              ? 'What do you like about the generated query?'
              : 'What could be better about the generated query?'
          }
        />
      )}
    </div>
  );
}

export { QueryFeedback };

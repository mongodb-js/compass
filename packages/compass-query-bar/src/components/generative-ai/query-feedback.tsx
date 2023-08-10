import {
  Button,
  Icon,
  FeedbackPopover,
  css,
  spacing,
  cx,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import React, { useRef, useState } from 'react';
import { connect } from 'react-redux';

import { submitFeedback } from '../../stores/ai-query-reducer';

const suggestionActionButtonStyles = css({
  flexShrink: 0,
  display: 'flex',
  gap: spacing[2],
});

const feedbackButtonLightStyles = css({
  // We fill the icon colors here as there is a bug with the
  // LeafyGreen ThumbsUp and ThumbsDown icons.
  fill: palette.gray.dark1,
});

const feedbackButtonDarkStyles = css({
  // We fill the icon colors here as there is a bug with the
  // LeafyGreen ThumbsUp and ThumbsDown icons.
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

type AITextInputProps = {
  onFeedback: (feedback: 'positive' | 'negative', text: string) => void;
};

function QueryFeedback({ onFeedback }: AITextInputProps) {
  const darkMode = useDarkMode();

  const feedbackPositiveButtonRef = useRef<HTMLInputElement>(null);
  const feedbackNegativeButtonRef = useRef<HTMLInputElement>(null);

  const [chosenFeedbackOption, setChosenFeedbackOption] = useState<
    'none' | 'positive' | 'negative'
  >('none');

  return (
    <div className={suggestionActionButtonStyles}>
      <Button
        className={cx(
          darkMode ? feedbackButtonDarkStyles : feedbackButtonLightStyles,
          chosenFeedbackOption === 'positive' && buttonActivePositiveStyles
        )}
        onClick={() => setChosenFeedbackOption('positive')}
        size="small"
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
          onFeedback={(feedbackText: string) =>
            onFeedback(chosenFeedbackOption, feedbackText)
          }
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

const ConnectedQueryFeedback = connect(null, {
  onFeedback: submitFeedback,
})(QueryFeedback);

export { ConnectedQueryFeedback as QueryFeedback };

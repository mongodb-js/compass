import React, { useCallback, useState } from 'react';
import {
  Button,
  ErrorSummary,
  IconButton,
  TextInput,
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import { RobotSVG } from './robot-svg';
import type { RootState } from '../../stores/query-bar-store';
import { runAIQuery } from '../../stores/ai-query-reducer';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[1],
  margin: `0px ${spacing[2]}px`,
  marginTop: '2px',
});

const inputContainerStyles = css({
  display: 'flex',
  position: 'relative',
  paddingTop: spacing[2],
});

const textInputStyles = css({
  width: '100%', // TODO: fill flex
});

const errorSummaryContainer = css({
  marginTop: spacing[1],
});

const floatingButtonsContainerStyles = css({
  position: 'absolute',
  top: spacing[2],
  right: spacing[1],
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
  height: spacing[4] + spacing[1],
});

const closeButtonStyles = css({
  // display: ''
});

const generateButtonStyles = css({
  border: 'none',
  height: spacing[4] - spacing[1],
  display: 'flex',
  fontSize: '12px',
});

const closeText = 'Close AI Query';

type AITextInputProps = {
  didSucceed: boolean;
  errorMessage?: string;
  show: boolean;
  onClose: () => void;
  onSubmitText: (text: string) => void;
};

const SubmitArrowSVG = ({ darkMode }: { darkMode?: boolean }) => (
  <svg
    width="14"
    height="14"
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

function AITextInput({
  errorMessage,
  show,
  onClose,
  onSubmitText,
}: AITextInputProps) {
  const [text, setText] = useState('');
  const darkMode = useDarkMode();

  const onTextInputKeyDown = useCallback(
    (evt: React.KeyboardEvent<HTMLInputElement>) => {
      if (evt.key === 'Enter') {
        evt.preventDefault();
        onSubmitText(text);
      } else if (evt.key === 'Escape') {
        // TODO: Is it esc?
        onClose();
      }
    },
    [text, onClose, onSubmitText]
  );

  if (!show) {
    return null;
  }

  return (
    <div className={containerStyles}>
      <div className={inputContainerStyles}>
        <TextInput
          className={textInputStyles}
          autoFocus
          sizeVariant="small"
          aria-label="Enter a plain text query that the AI will translate into MongoDB query language."
          placeholder="Tell Compass what documents to find (e.g. how many users signed up last month)"
          value={text}
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) =>
            setText(evt.currentTarget.value)
          }
          onKeyDown={onTextInputKeyDown}
        />
        <div className={floatingButtonsContainerStyles}>
          <Button
            size="small"
            className={generateButtonStyles}
            onClick={() => onSubmitText(text)}
          >
            <div>Generate</div>
            <SubmitArrowSVG darkMode={darkMode} />
          </Button>
          <IconButton
            aria-label={closeText}
            title={closeText}
            className={closeButtonStyles}
            onClick={() => onClose()}
          >
            <RobotSVG />
          </IconButton>
        </div>
      </div>
      {errorMessage && (
        <div className={errorSummaryContainer}>
          <ErrorSummary variant="danger" errors={errorMessage}>
            {errorMessage}
          </ErrorSummary>
        </div>
      )}
    </div>
  );
}

export {};
const ConnectedAITextInput = connect(
  (state: RootState) => {
    return {
      errorMessage: state.aiQuery.errorMessage,
      didSucceed: state.aiQuery.didSucceed,
    };
  },
  {
    onSubmitText: runAIQuery,
  }
)(AITextInput);

export { ConnectedAITextInput as AITextInput };

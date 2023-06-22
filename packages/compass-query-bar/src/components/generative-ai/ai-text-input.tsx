import React, { useState } from 'react';
import {
  Button,
  IconButton,
  TextInput,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { RobotSVG } from './robot-svg';

const containerStyles = css({
  display: 'flex',
  position: 'relative',
  // margin: `${spacing[3]}px 0px`,
  margin: `0px ${spacing[2]}px`,
  marginTop: '2px',
  paddingTop: spacing[2],
  // padding: spacing[1]
});

const textInputStyles = css({
  // marginTop
  // display: 'flex'
  width: '100%', // TODO: fill flex
});

const floatingButtonsContainerStyles = css({
  position: 'absolute',
  top: spacing[2],
  right: spacing[1],
  display: 'flex',
  gap: spacing[1],
});

const closeButtonStyles = css({
  // display: ''
});

const closeText = 'Close AI Query';

// const generateButtonStyles = css()

function AITextInput({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const [text, setText] = useState('');

  if (!show) {
    return null;
  }

  //   XSmall: 'xsmall',
  //   Small: 'small',
  //   Default: 'default',
  //   Large: 'large',
  // };

  return (
    <div className={containerStyles}>
      <TextInput
        className={textInputStyles}
        autoFocus
        sizeVariant="small"
        aria-label="Enter a plain text query that the AI will translate into MongoDB query language."
        placeholder="Tell Compass what documents to find (e.g. how many users signed up last month)"
        value={text}
        onChange={(evt) => setText(evt.currentTarget.value)}
      />
      <div className={floatingButtonsContainerStyles}>
        {/* <Button
          size="small"
          className={generateButtonStyles}
          variant="outline"
        >
          Generate
        </Button  > */}
        <IconButton
          aria-label={closeText}
          title={closeText}
          className={closeButtonStyles}
          onClick={() => onClose()}
        >
          <RobotSVG
          // size=
          // size={spacing[4]}
          // size={spacing[5]}
          />
        </IconButton>
      </div>
    </div>
  );
}

export { AITextInput };

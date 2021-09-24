/** @jsx jsx */
import { css, jsx } from '@emotion/react';
import React, { useState } from 'react';

const baseResizerStyles = css({
  position: 'absolute',
  background: 'transparent',
  padding: 0,
  transition: 'opacity 250ms ease',
  transitionDelay: '0ms',
  backgroundColor: '#019EE2',
  opacity: '0',
  outline: 'none',
  zIndex: 100,
  ':focus': {
    opacity: 1,
  },
  ':hover': {
    transitionDelay: '250ms',
    opacity: 1,
  },
  WebkitAppearance: 'none',
  '::-webkit-slider-thumb': {
    WebkitAppearance: 'none',
  },
  '::-ms-track': {
    background: 'none',
    borderColor: 'none',
    color: 'none',
  },
});

const verticalResizerStyle = css({
  width: '4px !important',
  right: '-2px',
  bottom: 0,
  top: 0,
  ':hover': {
    cursor: 'ew-resize',
  },
});

const horizontalResizerStyle = css({
  height: '4px !important',
  top: '-2px',
  right: 0,
  left: 0,
  ':hover': {
    cursor: 'ns-resize',
  },
});

function ResizeHandleVertical({
  onResize,
  step,
  width,
  minWidth,
  maxWidth,
}: {
  onResize: (newWidth: number) => void;
  step: number;
  width: number;
  minWidth: number;
  maxWidth: number;
}): React.ReactElement {
  const [isDragging, setDragging] = useState(false);

  function boundWidth(attemptedWidth: number) {
    return Math.min(maxWidth, Math.max(minWidth, attemptedWidth));
  }

  return (
    <input
      type="range"
      aria-roledescription="vertical splitter"
      aria-label="Width of the panel, resize using arrow keys"
      css={[baseResizerStyles, verticalResizerStyle]}
      min={minWidth}
      max={maxWidth}
      value={width}
      step={step}
      onChange={(event) => {
        if (isDragging) {
          // When dragging, we want the mouse movement to update the
          // width, not the value of the range where it's being dragged.
          return;
        }
        onResize(boundWidth(Number(event.target.value)));
      }}
      onMouseDown={() => {
        setDragging(true);
      }}
      onMouseMove={(event) => {
        if (isDragging) {
          onResize(boundWidth(width + event.movementX));
        }
      }}
      onMouseUp={(event) => {
        // We only want to maintain focus on the resizer when
        // the user has focused it using the keyboard.
        event.currentTarget.blur();

        setDragging(false);
        onResize(boundWidth(width + event.movementX));
      }}
    />
  );
}

function ResizeHandleHorizontal({
  onResize,
  step,
  height,
  minHeight,
  maxHeight,
}: {
  onResize: (newHeight: number) => void;
  step: number;
  height: number;
  minHeight: number;
  maxHeight: number;
}): React.ReactElement {
  const [isDragging, setDragging] = useState(false);

  function boundHeight(attemptedHeight: number) {
    return Math.min(maxHeight, Math.max(minHeight, attemptedHeight));
  }

  return (
    <input
      type="range"
      aria-roledescription="horizontal splitter"
      aria-label="Height of the panel, resize using arrow keys"
      min={minHeight}
      max={maxHeight}
      height={height}
      step={step}
      css={[baseResizerStyles, horizontalResizerStyle]}
      onChange={(event) => {
        if (isDragging) {
          // When dragging, we want the mouse movement to update the
          // width, not the value of the range where it's being dragged.
          return;
        }
        onResize(boundHeight(Number(event.target.value)));
      }}
      onMouseDown={() => {
        setDragging(true);
      }}
      onMouseMove={(event) => {
        if (isDragging) {
          onResize(boundHeight(height - event.movementY));
        }
      }}
      onMouseUp={(event) => {
        // We only want to maintain focus on the resizer when
        // the user has focused it using the keyboard.
        event.currentTarget.blur();

        setDragging(false);
        onResize(boundHeight(height - event.movementY));
      }}
    />
  );
}

export { ResizeHandleHorizontal, ResizeHandleVertical };

/** @jsx jsx */
import { css, jsx, SerializedStyles } from '@emotion/react';
import React, { useRef } from 'react';

enum RESIZE_DIRECTION {
  TOP = 'TOP',
  RIGHT = 'RIGHT',
}

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

function ResizeHandle({
  ariaLabel,
  ariaRoledescription,
  direction,
  step,
  styles,
  value,
  minValue,
  maxValue,
  onResize,
}: {
  ariaLabel: string;
  ariaRoledescription: string;
  direction: RESIZE_DIRECTION;
  step: number;
  styles: SerializedStyles;
  value: number;
  minValue: number;
  maxValue: number;
  onResize: (newSize: number) => void;
}) {
  const isDragging = useRef(false);

  function boundSize(attemptedSize: number) {
    return Math.min(maxValue, Math.max(minValue, attemptedSize));
  }

  return (
    <input
      type="range"
      aria-roledescription={ariaRoledescription}
      aria-label={ariaLabel}
      css={[baseResizerStyles, styles]}
      min={minValue}
      max={maxValue}
      value={value}
      step={step}
      onChange={(event) => {
        if (isDragging.current) {
          // When dragging, we want the mouse movement to update the
          // width, not the value of the range where it's being dragged.
          return;
        }
        onResize(boundSize(Number(event.target.value)));
      }}
      onMouseDown={() => {
        isDragging.current = true;
      }}
      onMouseMove={(event) => {
        if (isDragging.current) {
          if (direction === RESIZE_DIRECTION.RIGHT) {
            onResize(boundSize(value + event.movementX));
          } else if (direction === RESIZE_DIRECTION.TOP) {
            onResize(boundSize(value - event.movementY));
          }
        }
      }}
      onMouseUp={(event) => {
        // We only want to maintain focus on the resizer when
        // the user has focused it using the keyboard.
        event.currentTarget.blur();

        isDragging.current = false;
        if (direction === RESIZE_DIRECTION.RIGHT) {
          onResize(boundSize(value + event.movementX));
        } else if (direction === RESIZE_DIRECTION.TOP) {
          onResize(boundSize(value - event.movementY));
        }
      }}
    />
  );
}

function ResizeHandleVertical({
  onResize,
  step,
  width,
  minWidth,
  maxWidth,
  title,
}: {
  onResize: (newWidth: number) => void;
  step: number;
  width: number;
  minWidth: number;
  maxWidth: number;
  title: string;
}): React.ReactElement {
  return (
    <ResizeHandle
      ariaRoledescription="vertical splitter"
      ariaLabel={`Width of the ${title}, resize using arrow keys`}
      styles={verticalResizerStyle}
      direction={RESIZE_DIRECTION.RIGHT}
      minValue={minWidth}
      maxValue={maxWidth}
      onResize={onResize}
      value={width}
      step={step}
    />
  );
}

function ResizeHandleHorizontal({
  onResize,
  step,
  height,
  minHeight,
  maxHeight,
  title,
}: {
  onResize: (newHeight: number) => void;
  step: number;
  height: number;
  minHeight: number;
  maxHeight: number;
  title: string;
}): React.ReactElement {
  return (
    <ResizeHandle
      ariaRoledescription="horizontal splitter"
      ariaLabel={`Height of the ${title}, resize using arrow keys`}
      direction={RESIZE_DIRECTION.TOP}
      minValue={minHeight}
      maxValue={maxHeight}
      value={height}
      step={step}
      styles={horizontalResizerStyle}
      onResize={onResize}
    />
  );
}

export { ResizeHandleHorizontal, ResizeHandleVertical };

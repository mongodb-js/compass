import React, { useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';

enum ResizeDirection {
  TOP = 'TOP',
  RIGHT = 'RIGHT',
}

const baseResizerStyles = css({
  position: 'absolute',
  background: 'transparent',
  padding: 0,
  transition: 'opacity 250ms ease',
  transitionDelay: '0ms',
  backgroundColor: palette.blue.light1,
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
  width: '100%',
  height: '4px !important',
  top: '-2px',
  right: 0,
  left: 0,
  ':hover': {
    cursor: 'ns-resize',
  },
});

function ResizeHandle({
  direction,
  step = 10,
  value,
  minValue,
  maxValue,
  onChange,
  title,
}: {
  direction: ResizeDirection;
  step?: number;
  value: number;
  minValue: number;
  maxValue: number;
  onChange: (newValue: number) => void;
  title: string;
}): React.ReactElement {
  const isDragging = useRef(false);

  function boundSize(attemptedSize: number) {
    return Math.min(maxValue, Math.max(minValue, attemptedSize));
  }

  let directionTitle = 'vertical';
  let dimensionTitle = 'Width';
  let resizerStyle = verticalResizerStyle;

  if (direction === ResizeDirection.TOP) {
    directionTitle = 'horizontal';
    dimensionTitle = 'Height';
    resizerStyle = horizontalResizerStyle;
  }

  return (
    <input
      type="range"
      aria-roledescription={`${directionTitle} splitter`}
      aria-label={`${dimensionTitle} of the ${title}, resize using arrow keys`}
      className={cx(baseResizerStyles, resizerStyle)}
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
        onChange(boundSize(Number(event.target.value)));
      }}
      onMouseDown={() => {
        isDragging.current = true;
      }}
      onMouseMove={(event) => {
        if (isDragging.current) {
          if (direction === ResizeDirection.RIGHT) {
            onChange(boundSize(value + event.movementX));
          } else if (direction === ResizeDirection.TOP) {
            onChange(boundSize(value - event.movementY));
          }
        }
      }}
      onMouseUp={(event) => {
        // We only want to maintain focus on the resizer when
        // the user has focused it using the keyboard.
        event.currentTarget.blur();

        isDragging.current = false;
        if (direction === ResizeDirection.RIGHT) {
          onChange(boundSize(value + event.movementX));
        } else if (direction === ResizeDirection.TOP) {
          onChange(boundSize(value - event.movementY));
        }
      }}
    />
  );
}

export { ResizeHandle, ResizeDirection };

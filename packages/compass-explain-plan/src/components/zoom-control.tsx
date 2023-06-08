import React from 'react';
import { css, Button, Icon } from '@mongodb-js/compass-components';

const controlsContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
});

// We don't have a good enough leafygreen alternative, so we are modifying
// Button component styles here to match this sort of group button
const buttonStyles = css({
  // This box shadow effect doesn't stack well when two buttons are so close to
  // each other
  boxShadow: 'none !important',
  '&:first-child': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottom: 'none',
  },
  '&:last-child': {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  '& > div:last-child': {
    // No matching spacing exists to make them sqare when the icon is inside
    paddingLeft: 6,
    paddingRight: 6,
  },
});

const DEFAULT_ZOOM_STEP = 0.1;

const MIN_SCALE_VALUE = 0.2;

export const ZoomControl: React.FunctionComponent<{
  value: number;
  step?: number;
  minValue?: number;
  onZoomChange(newVal: number): void;
}> = ({
  value,
  step = DEFAULT_ZOOM_STEP,
  minValue = MIN_SCALE_VALUE,
  onZoomChange,
}) => {
  return (
    <div className={controlsContainerStyle}>
      <Button
        className={buttonStyles}
        leftGlyph={<Icon glyph="Plus" />}
        onClick={() => {
          onZoomChange(Math.max(minValue, value + step));
        }}
        size="small"
        aria-label="Zoom in"
      ></Button>
      <Button
        className={buttonStyles}
        leftGlyph={<Icon glyph="Minus" />}
        onClick={() => {
          onZoomChange(Math.max(minValue, value - step));
        }}
        size="small"
        aria-label="Zoom out"
      ></Button>
    </div>
  );
};

export default ZoomControl;

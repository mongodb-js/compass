import React, { useState } from 'react';
import {
  css,
  spacing,
  palette,
  useDarkMode,
  cx,
  KeylineCard,
  Icon,
  HorizontalRule,
} from '@mongodb-js/compass-components';

const controlsContainerStyle = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: spacing[2] - 2,
  border: `1px solid ${palette.gray.base}`,
});

const controlsDividerStyle = css({
  borderColor: palette.gray.base,
});

const controlStyle = css({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: spacing[4] + 4,
  height: spacing[4] + 4,
  border: 'none',
  borderRadius: '0',
  cursor: 'pointer',
  transition: 'all 150ms ease-in-out',

  color: palette.gray.base,
  '&:hover': {
    color: palette.black,
    background: palette.gray.light2,
  },
});

const controlStyleDarkMode = css({
  color: palette.gray.light1,
  '&:hover': {
    color: palette.gray.light3,
    background: palette.gray.dark1,
  },
});

const ZoomControl: React.FunctionComponent<{
  onZoomInClicked: () => void;
  onZoomOutClicked: () => void;
}> = ({ onZoomInClicked, onZoomOutClicked }) => {
  const isDarkMode = useDarkMode();
  const controlStyles = cx(controlStyle, {
    [controlStyleDarkMode]: isDarkMode,
  });
  return (
    <div className={controlsContainerStyle}>
      <KeylineCard onClick={onZoomInClicked} className={controlStyles}>
        <Icon glyph="Plus" size="default" />
      </KeylineCard>
      <HorizontalRule className={controlsDividerStyle} />
      <KeylineCard onClick={onZoomOutClicked} className={controlStyles}>
        <Icon glyph="Minus" size="default" />
      </KeylineCard>
    </div>
  );
};

const DEFAULT_ZOOM_STEP = 0.1;
const MIN_SCALE_VALUE = 0.4;

export const useZoom = (
  zoomStep = DEFAULT_ZOOM_STEP
): {
  scale: number;
  increaseScale: () => void;
  decreaseScale: () => void;
} => {
  const [scale, setScale] = useState(1);
  return {
    scale,
    increaseScale() {
      const nextScaleValue = scale + zoomStep;
      setScale(nextScaleValue);
    },
    decreaseScale() {
      const nextScaleValue = scale - zoomStep;
      if (nextScaleValue < MIN_SCALE_VALUE) {
        return;
      }
      setScale(nextScaleValue);
    },
  };
};

export default ZoomControl;

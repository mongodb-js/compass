import React from 'react';
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
  userSelect: 'none',
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
  const isDarkMode = useDarkMode();
  const controlStyles = cx(controlStyle, {
    [controlStyleDarkMode]: isDarkMode,
  });
  return (
    <div className={controlsContainerStyle}>
      <KeylineCard
        onClick={() => {
          onZoomChange(Math.max(minValue, value + step));
        }}
        className={controlStyles}
      >
        <Icon glyph="Plus" size="default" />
      </KeylineCard>
      <HorizontalRule className={controlsDividerStyle} />
      <KeylineCard
        onClick={() => {
          onZoomChange(Math.max(minValue, value - step));
        }}
        className={controlStyles}
      >
        <Icon glyph="Minus" size="default" />
      </KeylineCard>
    </div>
  );
};

export default ZoomControl;

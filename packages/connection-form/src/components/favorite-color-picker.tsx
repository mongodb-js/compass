import React from 'react';
import {
  css,
  cx,
  Label,
  spacing,
  palette,
} from '@mongodb-js/compass-components';
import {
  CONNECTION_COLOR_CODES,
  legacyColorsToColorCode,
  useConnectionColor,
} from '../hooks/use-connection-color';

/**
 * Default colors.
 */
const colorOptionStyles = css({
  outline: 'none',
  margin: 0,
  padding: 0,
  marginRight: spacing[2],
  borderRadius: '50%',
  verticalAlign: 'middle',
  width: spacing[5] + spacing[1],
  height: spacing[5] + spacing[1],
  border: '1px solid transparent',
  boxShadow: `0 0 0 0 ${palette.blue.light1}`,
  transition: 'box-shadow .16s ease-in',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    cursor: 'pointer',
  },
});

const activeColorOptionStyles = css({
  boxShadow: `0 0 0 3px ${palette.blue.light1}`,
  transitionTimingFunction: 'ease-out',
});

const inActiveColorOptionStyles = css({
  '&:focus, &:hover': {
    boxShadow: `0 0 0 3px ${palette.gray.light1}`,
  },
});

const noColorRedBarStyles = css({
  width: 40,
  borderTop: `3px solid ${palette.red.base}`,
  transform: 'rotate(-45deg)',
  position: 'absolute',
  left: -5,
});

const selectedColorCheckmarkStyles = css({
  margin: 0,
  padding: 0,
});

function ColorOption({
  isSelected,
  onClick,
  code,
  hex,
}: {
  isSelected: boolean;
  onClick: () => void;
  code: string;
  hex: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      style={{ background: hex }}
      className={cx({
        [colorOptionStyles]: true,
        [activeColorOptionStyles]: isSelected,
        [inActiveColorOptionStyles]: !isSelected,
      })}
      data-testid={`color-pick-${code}${isSelected ? '-selected' : ''}`}
      onClick={onClick}
      title={hex}
      aria-pressed={isSelected}
    >
      {isSelected && (
        // Show a checkmark in the selected color.
        <svg
          className={selectedColorCheckmarkStyles}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width={20}
          height={34}
        >
          <g
            fill="white"
            fillOpacity={isSelected ? 1 : 0}
            strokeOpacity={isSelected ? 1 : 0}
          >
            <path
              stroke="#ffffff"
              d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"
            />
          </g>
        </svg>
      )}
    </button>
  );
}

export function FavoriteColorPicker({
  colorCode,
  onChange,
}: {
  colorCode?: string;
  onChange: (newColor?: string) => void;
}): React.ReactElement {
  const selectedColorCode = legacyColorsToColorCode(colorCode);
  const { connectionColorToHex: colorCodeToHex } = useConnectionColor();
  const selectedColorHex = colorCodeToHex(selectedColorCode);
  return (
    <>
      <Label htmlFor="favorite-color-selector">Color</Label>
      <div id="favorite-color-selector">
        <button
          type="button"
          style={{
            background: 'white',
            borderColor: palette.black,
          }}
          className={cx({
            [colorOptionStyles]: true,
            [activeColorOptionStyles]: !selectedColorHex,
          })}
          onClick={() => {
            onChange();
          }}
          data-testid={`color-pick-no-color${
            !selectedColorHex ? '-selected' : ''
          }`}
          title="No color"
          aria-pressed={!selectedColorHex}
        >
          <div className={noColorRedBarStyles} />
        </button>
        {CONNECTION_COLOR_CODES.map((colorCode) => {
          const hex = colorCodeToHex(colorCode) || '';
          return (
            <ColorOption
              onClick={() => {
                onChange(colorCode);
              }}
              isSelected={colorCode === selectedColorCode}
              hex={hex}
              code={colorCode}
              key={colorCode}
            />
          );
        })}
      </div>
    </>
  );
}

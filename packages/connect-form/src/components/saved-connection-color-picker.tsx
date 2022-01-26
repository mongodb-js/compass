import React from 'react';
import { useUiKitContext } from '../contexts/ui-kit-context';

/**
 * Default colors.
 */
const COLORS = [
  '#5fc86e',
  '#326fde',
  '#deb342',
  '#d4366e',
  '#59c1e2',
  '#2c5f4a',
  '#d66531',
  '#773819',
  '#3b8196',
  '#ababab',
];

function ColorOption({
  isSelected,
  onClick,
  hex,
}: {
  isSelected: boolean;
  onClick: () => void;
  hex: string;
}): React.ReactElement {
  const {
    css,
    cx,
    spacing,
    uiColors
  } = useUiKitContext();

  const colorOptionStyles = css({
    outline: 'none',
    margin: 0,
    padding: 0,
    marginRight: spacing[2],
    borderRadius: '50%',
    verticalAlign: 'middle',
    width: 36,
    height: 36,
    border: '1px solid transparent',
    boxShadow: `0 0 0 0 ${uiColors.focus}`,
    transition: 'box-shadow .16s ease-in',
    position: 'relative',
    overflow: 'hidden',
  });
  
  const activeColorOptionStyles = css({
    boxShadow: `0 0 0 3px ${uiColors.focus}`,
    transitionTimingFunction: 'ease-out',
  });
  
  const inActiveColorOptionStyles = css({
    '&:focus, &:hover': {
      boxShadow: `0 0 0 3px ${uiColors.gray.light1}`,
    },
  });
  
  const selectedColorCheckmarkStyles = css({
    margin: 0,
    padding: 0,
  });

  return (
    <button
      style={{ background: hex }}
      className={cx({
        [colorOptionStyles]: true,
        [activeColorOptionStyles]: isSelected,
        [inActiveColorOptionStyles]: !isSelected,
      })}
      data-testid={`color-pick-${hex}${isSelected ? '-selected' : ''}`}
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

function SavedConnectionColorPicker({
  hex,
  onChange,
}: {
  hex?: string;
  onChange: (newColor?: string) => void;
}): React.ReactElement {
  const {
    css,
    cx,
    spacing,
    uiColors,
    Label,
  } = useUiKitContext();

  const colorOptionStyles = css({
    outline: 'none',
    margin: 0,
    padding: 0,
    marginRight: spacing[2],
    borderRadius: '50%',
    verticalAlign: 'middle',
    width: 36,
    height: 36,
    border: '1px solid transparent',
    boxShadow: `0 0 0 0 ${uiColors.focus}`,
    transition: 'box-shadow .16s ease-in',
    position: 'relative',
    overflow: 'hidden',
  });
  
  const activeColorOptionStyles = css({
    boxShadow: `0 0 0 3px ${uiColors.focus}`,
    transitionTimingFunction: 'ease-out',
  });
  
  const noColorRedBarStyles = css({
    width: 40,
    borderTop: `3px solid ${uiColors.red.base}`,
    transform: 'rotate(-45deg)',
    position: 'absolute',
    left: -5,
  });

  return (
    <>
      <Label htmlFor="favorite-color-selector">Color</Label>
      <div id="favorite-color-selector">
        <button
          style={{
            background: 'white',
            borderColor: uiColors.black,
          }}
          className={cx({
            [colorOptionStyles]: true,
            [activeColorOptionStyles]: !hex,
          })}
          onClick={() => {
            onChange();
          }}
          data-testid={`color-pick-no-color${!hex ? '-selected' : ''}`}
          title="No color"
          aria-pressed={!hex}
        >
          <div className={noColorRedBarStyles} />
        </button>
        {COLORS.map((color) => (
          <ColorOption
            onClick={() => {
              onChange(color);
            }}
            isSelected={color === hex}
            hex={color}
            key={color}
          />
        ))}
      </div>
    </>
  );
}

export default SavedConnectionColorPicker;

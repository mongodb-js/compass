import React, { useContext, useEffect, useMemo, useRef } from 'react';

import { css, cx } from '@leafygreen-ui/emotion';
import Icon from '@leafygreen-ui/icon';
import InlineDefinition from '@leafygreen-ui/inline-definition';
import { keyMap, Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';
import { transitionDuration, typeScales } from '@leafygreen-ui/tokens';

import {
  chipClassName,
  chipWrapperPaddingY,
  inputHeight,
} from './Combobox.styles';
import { ChipProps, ComboboxSize as Size } from './Combobox.types';
import { ComboboxContext } from './ComboboxContext';

const chipWrapperBaseStyle = css`
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  box-sizing: border-box;
`;

const chipWrapperSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    font-size: ${typeScales.body1.fontSize}px;
    line-height: ${typeScales.body1.lineHeight}px;
    border-radius: 4px;
  `,
  [Size.Large]: css`
    font-size: ${typeScales.body2.fontSize}px;
    line-height: ${typeScales.body2.lineHeight}px;
    border-radius: 4px;
  `,
};

const chipWrapperThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    color: ${palette.black};
    background-color: ${palette.gray.light2};

    // TODO: - refine these styles with Design
    &:focus-within {
      background-color: ${palette.blue.light2};
    }
  `,
  [Theme.Dark]: css`
    color: ${palette.gray.light2};
    background-color: ${palette.gray.dark2};

    &:focus-within {
      background-color: ${palette.blue.dark2};
    }
  `,
};

const disabledChipWrapperStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    cursor: not-allowed;
    color: ${palette.gray.base};
    background-color: ${palette.gray.light3};
  `,
  [Theme.Dark]: css`
    cursor: not-allowed;
    color: ${palette.gray.dark2};
    background-color: ${palette.gray.dark4};
    box-shadow: inset 0 0 1px 1px ${palette.gray.dark2}; ;
  `,
};

const chipTextSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    padding-inline: 6px;
    padding-block: ${chipWrapperPaddingY[Size.Default]}px;
  `,
  [Size.Large]: css`
    padding-inline: 10px;
    padding-block: ${chipWrapperPaddingY[Size.Large]}px;
  `,
};

const chipButtonStyle = css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  outline: none;
  border: none;
  background-color: transparent;
  cursor: pointer;
  transition: background-color ${transitionDuration.faster}ms ease-in-out;
`;

const chipButtonSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    height: ${inputHeight[Size.Default]}px;
  `,
  [Size.Large]: css`
    height: ${inputHeight[Size.Large]}px;
  `,
};

const chipButtonThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    color: ${palette.gray.dark2};

    &:hover {
      color: ${palette.black};
      background-color: ${palette.gray.light1};
    }
  `,
  [Theme.Dark]: css`
    color: ${palette.gray.light1};

    &:hover {
      color: ${palette.gray.light3};
      background-color: ${palette.gray.dark1};
    }
  `,
};

const chipButtonDisabledStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    cursor: not-allowed;
    color: ${palette.gray.dark2};
    &:hover {
      color: inherit;
      background-color: unset;
    }
  `,
  [Theme.Dark]: css`
    cursor: not-allowed;
    color: ${palette.gray.dark2};
    &:hover {
      color: inherit;
      background-color: unset;
    }
  `,
};

export const Chip = React.forwardRef<HTMLSpanElement, ChipProps>(
  ({ displayName, isFocused, onRemove, onFocus }: ChipProps, forwardedRef) => {
    const {
      darkMode,
      theme,
      size,
      disabled,
      chipTruncationLocation = 'end',
      chipCharacterLimit = 12,
    } = useContext(ComboboxContext);

    const isTruncated =
      !!chipCharacterLimit &&
      !!chipTruncationLocation &&
      chipTruncationLocation !== 'none' &&
      displayName.length > chipCharacterLimit;

    const buttonRef = useRef<HTMLButtonElement>(null);

    const truncatedName = useMemo(() => {
      if (isTruncated) {
        const ellipsis = '…';
        const chars = chipCharacterLimit - 3; // ellipsis dots included in the char limit

        switch (chipTruncationLocation) {
          case 'start': {
            const end = displayName
              .substring(displayName.length - chars)
              .trim();
            return ellipsis + end;
          }

          case 'middle': {
            const start = displayName.substring(0, chars / 2).trim();
            const end = displayName
              .substring(displayName.length - chars / 2)
              .trim();
            return start + ellipsis + end;
          }

          case 'end': {
            const start = displayName.substring(0, chars).trim();
            return start + ellipsis;
          }

          default: {
            return displayName;
          }
        }
      }

      return false;
    }, [chipCharacterLimit, chipTruncationLocation, displayName, isTruncated]);

    useEffect(() => {
      if (isFocused && !disabled) {
        buttonRef?.current?.focus();
      }
    }, [disabled, forwardedRef, isFocused]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (
        !disabled &&
        (e.keyCode === keyMap.Delete ||
          e.keyCode === keyMap.Backspace ||
          e.keyCode === keyMap.Enter ||
          e.keyCode === keyMap.Space)
      ) {
        onRemove();
      }
    };

    const handleChipClick = (e: React.MouseEvent) => {
      // Did not click button
      if (!buttonRef.current?.contains(e.target as Node)) {
        onFocus();
      }
    };

    const handleButtonClick = () => {
      if (!disabled) {
        onRemove();
      }
    };

    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events
      <span
        role="option"
        aria-selected={isFocused}
        data-testid="lg-combobox-chip"
        ref={forwardedRef}
        className={cx(
          chipClassName,
          chipWrapperBaseStyle,
          chipWrapperThemeStyle[theme],
          chipWrapperSizeStyle[size],
          {
            [disabledChipWrapperStyle[theme]]: disabled,
          }
        )}
        onClick={handleChipClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <span className={cx(chipTextSizeStyle[size])}>
          {truncatedName ? (
            <InlineDefinition
              darkMode={darkMode}
              definition={displayName}
              align="bottom"
            >
              {truncatedName}
            </InlineDefinition>
          ) : (
            displayName
          )}
        </span>
        <button
          aria-label={`Deselect ${displayName}`}
          aria-disabled={disabled}
          disabled={disabled}
          ref={buttonRef}
          className={cx(
            chipButtonStyle,
            chipButtonThemeStyle[theme],
            chipButtonSizeStyle[size],
            {
              [chipButtonDisabledStyle[theme]]: disabled,
            }
          )}
          onClick={handleButtonClick}
        >
          <Icon glyph="X" />
        </button>
      </span>
    );
  }
);
Chip.displayName = 'Chip';

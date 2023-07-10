/* eslint-disable filename-rules/match */
import React, { useCallback, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';

import Checkbox from '@leafygreen-ui/checkbox';
import { css, cx } from '@leafygreen-ui/emotion';
import { useForwardedRef, useIdAllocator } from '@leafygreen-ui/hooks';
import Icon, { isComponentGlyph } from '@leafygreen-ui/icon';
import { Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';
import { fontFamilies, spacing, typeScales } from '@leafygreen-ui/tokens';

import { menuItemHeight, menuItemPadding } from './ComboboxMenu/Menu.styles';
import type {
  ComboboxOptionProps,
  InternalComboboxOptionProps,
} from './Combobox.types';
import { ComboboxSize as Size } from './Combobox.types';
import { ComboboxContext } from './ComboboxContext';
import { wrapJSX } from './utils';

/**
 * Styles
 */

const comboboxOptionBaseStyle = css`
  position: relative;
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  list-style: none;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  font-family: ${fontFamilies.default};

  // Left wedge
  &:before {
    content: '';
    position: absolute;
    left: 0;
    width: 4px;
    height: calc(100% - 14px);
    background-color: rgba(255, 255, 255, 0);
    border-radius: 0 6px 6px 0;
    transform: scale3d(0, 0.3, 0);
    transition: 200ms ease-in-out;
    transition-property: transform, background-color;
  }
`;

const optionNameStyles = (width: number) => css`
  max-width: ${width}px;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-right: ${spacing[2]}px;
`;

const comboboxOptionThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    &:hover {
      outline: none;
      background-color: ${palette.gray.light2};
    }
  `,
  [Theme.Dark]: css`
    &:hover {
      outline: none;
      background-color: ${palette.gray.dark4};
    }
  `,
};

const comboboxOptionSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    font-size: ${typeScales.body1.fontSize}px;
    line-height: ${typeScales.body1.lineHeight}px;
    min-height: ${menuItemHeight[Size.Default]}px;
    padding: ${menuItemPadding[Size.Default].y}px
      ${menuItemPadding[Size.Default].x}px;
    gap: ${spacing[1]}px;

    &:before {
      max-height: ${menuItemHeight[Size.Default]}px;
    }
  `,
  [Size.Large]: css`
    font-size: ${typeScales.body2.fontSize}px;
    line-height: ${typeScales.body2.lineHeight}px;
    min-height: ${menuItemHeight[Size.Large]}px;
    padding: ${menuItemPadding[Size.Large].y}px
      ${menuItemPadding[Size.Large].x}px;
    gap: ${spacing[2]}px;

    &:before {
      max-height: ${menuItemHeight[Size.Large]}px;
    }
  `,
};

const _comboboxOptionBaseActiveStyle = css`
  outline: none;

  &:before {
    transform: scaleY(1);
  }
`;

const comboboxOptionActiveStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    ${_comboboxOptionBaseActiveStyle};
    background-color: ${palette.blue.light3};

    &:before {
      background-color: ${palette.blue.base};
    }
  `,
  [Theme.Dark]: css`
    ${_comboboxOptionBaseActiveStyle};
    background-color: ${palette.blue.dark3};

    &:before {
      background-color: ${palette.blue.light1};
    }
  `,
};

const _comboboxOptionBaseDisabledStyle = css`
  cursor: not-allowed;

  &:hover {
    background-color: inherit;
  }

  &:before {
    content: unset;
  }
`;

const comboboxOptionDisabledStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    ${_comboboxOptionBaseDisabledStyle};
    color: ${palette.gray.light1};
  `,
  [Theme.Dark]: css`
    ${_comboboxOptionBaseDisabledStyle};
    color: ${palette.gray.dark1};
  `,
};

const checkIconStyle: Record<Size, string> = {
  [Size.Default]: css`
    min-width: ${spacing[3]}px;
  `,
  [Size.Large]: css`
    min-width: ${spacing[4]}px;
  `,
};

const flexSpan = css`
  display: inline-flex;
  gap: 8px;
  justify-content: start;
  align-items: inherit;
  overflow-wrap: anywhere;
`;

const disallowPointer = css`
  pointer-events: none;
`;

const displayNameStyle = (isSelected: boolean) => css`
  font-weight: ${isSelected ? 'bold' : 'normal'};
`;

/**
 * Component
 */
const InternalComboboxOption = React.forwardRef<
  HTMLLIElement,
  InternalComboboxOptionProps
>(
  (
    {
      displayName,
      glyph,
      isSelected,
      isFocused,
      disabled,
      setSelected,
      className,
      description,
    }: InternalComboboxOptionProps,
    forwardedRef
  ) => {
    const {
      multiselect,
      darkMode,
      theme,
      withIcons,
      inputValue,
      size,
      searchInputSize,
    } = useContext(ComboboxContext);
    const optionTextId = useIdAllocator({ prefix: 'combobox-option-text' });
    const optionRef = useForwardedRef(forwardedRef, null);

    const handleOptionClick = useCallback(
      (e: React.SyntheticEvent) => {
        // stopPropagation will not stop the keyDown event (only click)
        // since the option is never `focused`, only `aria-selected`
        // the keyDown event does not actually fire on the option element
        e.stopPropagation();

        if (!disabled) {
          setSelected();
        }
      },
      [disabled, optionRef, setSelected]
    );

    const renderedIcon = useMemo(() => {
      if (glyph) {
        if (isComponentGlyph(glyph)) {
          return glyph;
        }
        // eslint-disable-next-line no-console
        console.error(
          '`ComboboxOption` instance did not render icon because it is not a known glyph element.',
          glyph
        );
      }
    }, [glyph]);

    const renderedChildren = useMemo(() => {
      // Multiselect
      if (multiselect) {
        const checkbox = (
          <Checkbox
            aria-labelledby={optionTextId}
            checked={isSelected}
            tabIndex={-1}
            disabled={disabled}
            darkMode={darkMode}
            className={css`
              // TODO: Remove when this is resolved:
              // https://jira.mongodb.org/browse/PD-2171
              & > label > div {
                margin-top: 0;
              }
            `}
          />
        );

        return (
          <>
            <span className={optionNameStyles(searchInputSize)}>
              <span className={cx(flexSpan, disallowPointer)}>
                {withIcons ? renderedIcon : checkbox}
                <span
                  id={optionTextId}
                  className={displayNameStyle(isSelected)}
                >
                  {wrapJSX(displayName, inputValue, 'strong')}
                </span>
              </span>
              {withIcons && checkbox}
            </span>
            {description && <span>{description}</span>}
          </>
        );
      }

      // Single select
      return (
        <>
          <span className={optionNameStyles(searchInputSize)}>
            <span className={cx(flexSpan, disallowPointer)}>
              {renderedIcon}
              <span className={displayNameStyle(isSelected)}>
                {wrapJSX(displayName, inputValue, 'strong')}
              </span>
            </span>
            {isSelected && (
              <Icon
                glyph="Checkmark"
                className={checkIconStyle[size]}
                color={darkMode ? palette.blue.light1 : palette.blue.base}
              />
            )}
          </span>
          {description && <span>{description}</span>}
        </>
      );
    }, [
      multiselect,
      renderedIcon,
      isSelected,
      displayName,
      inputValue,
      size,
      darkMode,
      optionTextId,
      disabled,
      withIcons,
    ]);

    return (
      <li
        ref={optionRef}
        role="option"
        aria-selected={isFocused}
        aria-label={displayName}
        tabIndex={-1}
        className={cx(
          comboboxOptionBaseStyle,
          comboboxOptionSizeStyle[size],
          comboboxOptionThemeStyle[theme],
          {
            [comboboxOptionActiveStyle[theme]]: isFocused,
            [comboboxOptionDisabledStyle[theme]]: disabled,
          },
          className
        )}
        onClick={handleOptionClick}
        onKeyDown={handleOptionClick}
      >
        {renderedChildren}
      </li>
    );
  }
);
InternalComboboxOption.displayName = 'ComboboxOption';

export { InternalComboboxOption };
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function ComboboxOption(_: ComboboxOptionProps): JSX.Element {
  throw Error('`ComboboxOption` must be a child of a `Combobox` instance');
}
ComboboxOption.displayName = 'ComboboxOption';

ComboboxOption.propTypes = {
  displayName: PropTypes.string,
  value: PropTypes.string,
  glyph: PropTypes.node,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

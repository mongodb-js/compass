import { css, cx } from '@leafygreen-ui/emotion';
import React, { useCallback, useContext, useMemo } from 'react';
import { uiColors } from '@leafygreen-ui/palette';
import { isComponentType } from '@leafygreen-ui/lib';
import { useForwardedRef, useIdAllocator } from '@leafygreen-ui/hooks';
import Checkbox from '@leafygreen-ui/checkbox';
import Icon, { isComponentGlyph } from '@leafygreen-ui/icon';
import type { InternalComboboxOptionProps } from './combobox-types';
import { ComboboxContext } from './combobox-context';
import { wrapJSX } from './util';

/**
 * Styles
 */
const comboboxOptionStyle = () => css`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  list-style: none;
  color: inherit;
  cursor: pointer;
  overflow: hidden;
  font-size: var(--lg-combobox-item-font-size);
  line-height: var(--lg-combobox-item-line-height);
  padding: var(--lg-combobox-item-padding-y) var(--lg-combobox-item-padding-x);

  &:before {
    content: '';
    position: absolute;
    left: 0;
    width: 3px;
    height: var(--lg-combobox-item-wedge-height);
    background-color: transparent;
    border-radius: 0 2px 2px 0;
    transform: scaleY(0.3);
    transition: 150ms ease-in-out;
    transition-property: transform, background-color;
  }

  &:hover {
    outline: none;
    background-color: var(--lg-combobox-item-hover-color);
  }

  &[aria-selected='true'] {
    outline: none;
    background-color: var(--lg-combobox-item-active-color);

    &:before {
      background-color: var(--lg-combobox-item-wedge-color);
      transform: scaleY(1);
    }
  }
`;

const flexSpan = css`
  display: inline-flex;
  gap: 8px;
  justify-content: start;
  align-items: inherit;
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
      setSelected,
      className,
    }: InternalComboboxOptionProps,
    forwardedRef
  ) => {
    const { multiselect, darkMode, withIcons, inputValue } =
      useContext(ComboboxContext);
    const optionTextId = useIdAllocator({ prefix: 'combobox-option-text' });
    const optionRef = useForwardedRef(forwardedRef, null);

    const handleOptionClick = useCallback(
      (e: React.SyntheticEvent) => {
        e.stopPropagation();
        // If user clicked on the option, or the checkbox
        // Ignore extra click events on the checkbox wrapper
        if (
          e.target === optionRef.current ||
          (e.target as Element).tagName === 'INPUT' ||
          (e.target as Element).tagName === 'SPAN' // TODO(alenakhineika): investigate this workaround later.
        ) {
          setSelected();
        }
      },
      [optionRef, setSelected]
    );

    const renderedIcon = useMemo(() => {
      if (glyph) {
        if (isComponentGlyph(glyph) || isComponentType(glyph, 'Icon')) {
          return glyph;
        }
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
            // Using empty label due to this bug: https://jira.mongodb.org/browse/PD-1681
            label=""
            aria-labelledby={optionTextId}
            checked={isSelected}
            tabIndex={-1}
            animate={false}
          />
        );

        return (
          <>
            <span className={flexSpan}>
              {withIcons ? renderedIcon : checkbox}
              <span id={optionTextId} className={displayNameStyle(isSelected)}>
                {wrapJSX(displayName, inputValue, 'strong')}
              </span>
            </span>
            {withIcons && checkbox}
          </>
        );
      }

      // Single select
      return (
        <>
          <span className={flexSpan}>
            {renderedIcon}
            <span className={displayNameStyle(isSelected)}>
              {wrapJSX(displayName, inputValue, 'strong')}
            </span>
          </span>
          {isSelected && (
            <Icon
              glyph="Checkmark"
              color={darkMode ? uiColors.blue.light1 : uiColors.blue.base}
            />
          )}
        </>
      );
    }, [
      multiselect,
      renderedIcon,
      isSelected,
      displayName,
      inputValue,
      darkMode,
      optionTextId,
      withIcons,
    ]);

    return (
      <li
        ref={optionRef}
        role="option"
        aria-selected={isFocused}
        aria-label={displayName}
        tabIndex={-1}
        className={cx(comboboxOptionStyle(), className)}
        onClick={handleOptionClick}
        onKeyPress={handleOptionClick}
      >
        {renderedChildren}
      </li>
    );
  }
);
InternalComboboxOption.displayName = 'ComboboxOption';

export { InternalComboboxOption };
export default function ComboboxOption(): JSX.Element {
  throw Error('`ComboboxOption` must be a child of a `Combobox` instance');
}
ComboboxOption.displayName = 'ComboboxOption';

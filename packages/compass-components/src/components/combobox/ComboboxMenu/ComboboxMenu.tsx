import React, { useContext, useMemo } from 'react';
import isUndefined from 'lodash/isUndefined';

import { css, cx } from '@leafygreen-ui/emotion';
import { useAvailableSpace, useForwardedRef } from '@leafygreen-ui/hooks';
import Icon from '@leafygreen-ui/icon';
import { palette } from '@leafygreen-ui/palette';
import Popover from '@leafygreen-ui/popover';

import { ComboboxProps } from '../Combobox.types';
import { ComboboxContext } from '../ComboboxContext';

import {
  loadingIconStyle,
  menuBaseStyle,
  menuList,
  menuMessageBaseStyle,
  menuMessageSizeStyle,
  menuMessageThemeStyle,
  menuThemeStyle,
  popoverStyle,
  popoverThemeStyle,
} from './Menu.styles';

type ComboboxMenuProps = {
  children?: React.ReactNode;
  refEl: React.RefObject<HTMLDivElement>;
  id: string;
  labelId: string;
} & Pick<
  ComboboxProps<any>,
  | 'searchLoadingMessage'
  | 'searchErrorMessage'
  | 'searchEmptyMessage'
  | 'usePortal'
  | 'portalClassName'
  | 'portalContainer'
  | 'scrollContainer'
  | 'popoverZIndex'
  | 'className'
>;

export const ComboboxMenu = React.forwardRef<HTMLDivElement, ComboboxMenuProps>(
  (
    {
      children,
      id,
      refEl,
      labelId,
      searchLoadingMessage,
      searchErrorMessage,
      searchEmptyMessage,
      className,
      ...popoverProps
    }: ComboboxMenuProps,
    forwardedRef
  ) => {
    const { disabled, darkMode, theme, size, isOpen, searchState } =
      useContext(ComboboxContext);
    const ref = useForwardedRef(forwardedRef, null);

    /** The max height of the menu element */
    const availableSpace = useAvailableSpace(refEl);
    const maxHeightValue = !isUndefined(availableSpace)
      ? `${Math.min(availableSpace, 256)}px`
      : 'unset';

    /**
     * The rendered menu JSX contents
     * Includes error, empty, search and default states
     */
    const renderedMenuContents = useMemo((): JSX.Element => {
      const messageStyles = cx(
        menuMessageBaseStyle,
        menuMessageThemeStyle[theme],
        menuMessageSizeStyle[size]
      );

      switch (searchState) {
        case 'loading': {
          return (
            <span className={messageStyles}>
              <Icon
                glyph="Refresh"
                color={darkMode ? palette.blue.light1 : palette.blue.base}
                className={loadingIconStyle}
              />
              {searchLoadingMessage}
            </span>
          );
        }

        case 'error': {
          return (
            <span className={messageStyles}>
              <Icon
                glyph="Warning"
                color={darkMode ? palette.red.light1 : palette.red.base}
              />
              {searchErrorMessage}
            </span>
          );
        }

        case 'unset':
        default: {
          if (
            children &&
            typeof children === 'object' &&
            'length' in children &&
            children.length > 0
          ) {
            return <ul className={menuList}>{children}</ul>;
          }

          return <span className={messageStyles}>{searchEmptyMessage}</span>;
        }
      }
    }, [
      theme,
      size,
      searchState,
      darkMode,
      searchLoadingMessage,
      searchErrorMessage,
      children,
      searchEmptyMessage,
    ]);

    return (
      <Popover
        active={isOpen && !disabled}
        spacing={4}
        align="bottom"
        justify="middle"
        refEl={refEl}
        adjustOnMutation={true}
        className={cx(className, popoverStyle, popoverThemeStyle[theme])}
        {...popoverProps}
      >
        <div
          ref={ref}
          id={id}
          role="listbox"
          aria-labelledby={labelId}
          aria-expanded={isOpen}
          className={cx(
            menuBaseStyle,
            menuThemeStyle[theme],
            css`
              max-height: ${maxHeightValue};
            `
          )}
          onMouseDownCapture={(e) => e.preventDefault()}
        >
          {renderedMenuContents}
        </div>
      </Popover>
    );
  }
);

ComboboxMenu.displayName = 'ComboboxMenu';

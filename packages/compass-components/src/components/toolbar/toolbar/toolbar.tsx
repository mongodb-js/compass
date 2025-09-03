import React, { useState } from 'react';

import {
  DescendantsProvider,
  useInitDescendants,
} from '@leafygreen-ui/descendants';
import { useDarkMode } from '@leafygreen-ui/leafygreen-provider';
import { keyMap } from '@leafygreen-ui/lib';

import { ToolbarContextProvider, ToolbarDescendantsContext } from '../context';
import { DEFAULT_LGID_ROOT, getLgIds } from '../utils';

import { getBaseStyles } from './toolbar.styles';
import { type ToolbarProps } from './toolbar.types';

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  (
    {
      className,
      children,
      darkMode: darkModeProp,
      'data-lgid': dataLgId = DEFAULT_LGID_ROOT,
      ...rest
    }: ToolbarProps,
    forwardedRef
  ) => {
    const { darkMode, theme } = useDarkMode(darkModeProp);
    const { descendants, dispatch } = useInitDescendants<HTMLButtonElement>(
      ToolbarDescendantsContext
    );
    const [focusedIndex, setFocusedIndex] = useState(0);
    const childrenLength = descendants?.length ?? 0;
    const [isUsingKeyboard, setIsUsingKeyboard] = useState(false);

    const lgIds = getLgIds(dataLgId);

    /**
     * Implements roving tabindex
     * https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex
     * @param event Keyboard event
     */
    const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Note: Arrow keys don't fire a keyPress event — need to use onKeyDownCapture
      // We only handle up and down arrow keys
      switch (event.key) {
        case keyMap.ArrowDown:
          event.stopPropagation();
          event.preventDefault();
          setIsUsingKeyboard(true);
          setFocusedIndex((focusedIndex + 1) % childrenLength);
          break;
        case keyMap.ArrowUp:
          event.stopPropagation();
          event.preventDefault();
          setIsUsingKeyboard(true);
          setFocusedIndex((focusedIndex - 1 + childrenLength) % childrenLength);
          break;
        default:
          break;
      }
    };

    /**
     * Callback to handle click events on ToolbarIconButtons.
     * Also updates the focused index to ensure that the correct button is focused when using the up/down arrows.
     * @param event MouseEvent
     * @param focusedIndex number
     * @param onClick MouseEvent
     */
    const handleOnIconButtonClick = (
      event: React.MouseEvent<HTMLButtonElement>,
      focusedIndex: number,
      onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
    ) => {
      onClick?.(event);
      // This ensures that on click, the buttons tabIndex is set to 0 so that when the up/down arrows are pressed, the correct button is focused
      setFocusedIndex(focusedIndex);
    };

    return (
      <ToolbarContextProvider
        darkMode={darkMode}
        focusedIndex={focusedIndex}
        shouldFocus={isUsingKeyboard}
        lgIds={lgIds}
        handleOnIconButtonClick={handleOnIconButtonClick}
      >
        <DescendantsProvider
          context={ToolbarDescendantsContext}
          descendants={descendants}
          dispatch={dispatch}
        >
          <div
            role="toolbar"
            ref={forwardedRef}
            className={getBaseStyles({ theme, className })}
            aria-orientation="vertical"
            onKeyDownCapture={handleKeyDown}
            onBlur={() => setIsUsingKeyboard(false)}
            onMouseDown={() => setIsUsingKeyboard(false)}
            data-lgid={lgIds.root}
            data-testid={lgIds.root}
            {...rest}
          >
            {children}
          </div>
        </DescendantsProvider>
      </ToolbarContextProvider>
    );
  }
);

Toolbar.displayName = 'Toolbar';

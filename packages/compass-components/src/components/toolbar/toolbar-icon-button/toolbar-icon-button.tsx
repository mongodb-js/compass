import React, { type ComponentPropsWithoutRef, useEffect } from 'react';

import { useDescendant } from '@leafygreen-ui/descendants';
import Icon from '@leafygreen-ui/icon';
import IconButton from '@leafygreen-ui/icon-button';
import { useDarkMode } from '@leafygreen-ui/leafygreen-provider';
import { getNodeTextContent } from '@leafygreen-ui/lib';
import Tooltip, { Align } from '@leafygreen-ui/tooltip';

import { ToolbarDescendantsContext, useToolbarContext } from '../context';

import {
  getIconButtonStyles,
  triggerStyles,
} from './toolbar-icon-button.styles';
import { type ToolbarIconButtonProps } from './toolbar-icon-button.types';

export const ToolbarIconButton = React.forwardRef<
  HTMLButtonElement,
  ToolbarIconButtonProps
>(
  (
    {
      className,
      onClick,
      label,
      glyph,
      disabled = false,
      active = false,
      'aria-label': ariaLabel,
      ...rest
    }: ToolbarIconButtonProps,
    forwardedRef
  ) => {
    const { theme } = useDarkMode();
    const { index, ref } = useDescendant(
      ToolbarDescendantsContext,
      forwardedRef
    );
    const { focusedIndex, shouldFocus, lgIds, handleOnIconButtonClick } =
      useToolbarContext();
    const isFocusable = index === focusedIndex;

    if (focusedIndex === undefined) {
      // eslint-disable-next-line no-console
      console.error(
        'ToolbarIconButton should only be used inside the Toolbar component.'
      );
    }

    if (glyph === undefined) {
      // eslint-disable-next-line no-console
      console.error(
        'A glpyh is required for ToolbarIconButton. Please provide a valid glyph. The list of available glyphs can be found in the LG Icon README, https://github.com/mongodb/leafygreen-ui/blob/main/packages/icon/README.md#properties.'
      );
    }

    useEffect(() => {
      // shouldFocus prevents this component from hijacking focus on initial page load.
      if (isFocusable && shouldFocus) ref.current?.focus();
    }, [isFocusable, ref, shouldFocus]);

    return (
      <Tooltip
        data-testid={`${lgIds.iconButtonTooltip}-${index}`}
        data-lgid={`${lgIds.iconButtonTooltip}-${index}`}
        align={Align.Left}
        trigger={
          <div className={triggerStyles}>
            <IconButton
              aria-label={ariaLabel || getNodeTextContent(label)}
              active={active}
              className={getIconButtonStyles({
                theme,
                active,
                disabled,
                className,
              })}
              tabIndex={isFocusable ? 0 : -1}
              onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
                handleOnIconButtonClick(event, index, onClick)
              }
              disabled={disabled}
              data-testid={`${lgIds.iconButton}-${index}`}
              data-lgid={`${lgIds.iconButton}-${index}`}
              data-active={active}
              ref={ref}
              {...(rest as ComponentPropsWithoutRef<'button'>)}
            >
              <Icon glyph={glyph} />
            </IconButton>
          </div>
        }
      >
        {label}
      </Tooltip>
    );
  }
);

ToolbarIconButton.displayName = 'ToolbarIconButton';

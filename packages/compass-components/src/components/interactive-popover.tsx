import React, { useCallback, useEffect, useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import FocusTrap from 'focus-trap-react';

import { Icon, IconButton, Popover } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { rgba } from 'polished';
import { useDarkMode } from '../hooks/use-theme';
import { useHotkeys } from '../hooks/use-hotkeys';
import { useId } from '@react-aria/utils';

const borderRadius = spacing[2];

const contentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  alignItems: 'center',
  borderRadius: borderRadius,
  boxShadow: `0px 2px 4px -1px ${rgba(palette.black, 0.15)}`,
  border: `1px solid`,
  overflow: 'hidden',
  width: 'fit-content',
});

const contentContainerStylesLight = css({
  borderColor: palette.gray.light2,
  backgroundColor: palette.gray.light3,
  color: palette.gray.dark2,
});

const contentContainerStylesDark = css({
  borderColor: palette.gray.dark2,
  backgroundColor: palette.black,
  color: palette.white,
});

const closeButtonStyles = css({
  position: 'absolute',
  top: spacing[2],
  right: spacing[2],
});

type InteractivePopoverProps = {
  className: string;
  children: React.ReactElement;
  trigger: (triggerProps: {
    onClick: (event: React.MouseEvent | React.TouchEvent) => void;
    ref: React.RefObject<HTMLButtonElement>;
    children: React.ReactNode;
  }) => React.ReactElement;
  open: boolean;
  setOpen: (open: boolean) => void;
  /**
   * List of selector to consider contained elements to skip closing on click
   */
  containedElements?: string[];
};

function InteractivePopover({
  className,
  children,
  trigger,
  open,
  setOpen,
  containedElements = [],
}: InteractivePopoverProps): React.ReactElement {
  const darkMode = useDarkMode();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const popoverContentContainerRef = useRef<HTMLDivElement>(null);

  const onClose = useCallback(() => {
    setOpen(false);

    // Return focus to the trigger when the popover is hidden.
    setTimeout(() => {
      triggerRef.current?.focus();
    });
  }, [setOpen]);

  const onClickTrigger = useCallback(() => {
    if (open) {
      onClose();
      return;
    }

    setOpen(!open);
  }, [open, setOpen, onClose]);

  // When the popover is open, close it when an item that isn't the popover
  // is clicked.
  useEffect(() => {
    if (!open) {
      return;
    }

    const clickEventListener = (event: MouseEvent | TouchEvent) => {
      // Ignore clicks on the popover.
      if (
        !popoverContentContainerRef.current ||
        popoverContentContainerRef.current.contains(event.target as Node)
      ) {
        return;
      }
      // Ignore clicks on the trigger as it has its own handler.
      if (
        !triggerRef.current ||
        triggerRef.current.contains(event.target as Node)
      ) {
        return;
      }

      if (
        containedElements.some((selector) => {
          return document
            .querySelector(selector)
            ?.contains(event.target as Node);
        })
      ) {
        return;
      }

      onClose();
    };
    window.addEventListener('mousedown', clickEventListener);
    window.addEventListener('touchstart', clickEventListener);
    return () => {
      window.removeEventListener('mousedown', clickEventListener);
      window.removeEventListener('touchstart', clickEventListener);
    };
  }, [open, onClose, containedElements]);

  useHotkeys('Escape', onClose, { enabled: open }, [onClose]);

  const closeButtonId = useId('close-button-id');

  return trigger({
    onClick: onClickTrigger,
    ref: triggerRef,
    children: (
      <Popover
        align="bottom"
        justify="start"
        active={open}
        adjustOnMutation
        usePortal
        spacing={0}
        className={className}
        refEl={triggerRef}
      >
        {open && (
          <FocusTrap
            focusTrapOptions={{
              clickOutsideDeactivates: true,
              // Tests fail without a fallback. (https://github.com/focus-trap/focus-trap-react/issues/91)
              fallbackFocus: `#${closeButtonId}`,
            }}
          >
            <div
              className={cx(
                contentContainerStyles,
                darkMode
                  ? contentContainerStylesDark
                  : contentContainerStylesLight
              )}
              ref={popoverContentContainerRef}
            >
              {children}

              <IconButton
                className={closeButtonStyles}
                data-testid="interactive-popover-close-button"
                onClick={onClose}
                aria-label="Close"
                id={closeButtonId}
                ref={closeButtonRef}
              >
                <Icon glyph="X" />
              </IconButton>
            </div>
          </FocusTrap>
        )}
      </Popover>
    ),
  });
}

export { InteractivePopover };

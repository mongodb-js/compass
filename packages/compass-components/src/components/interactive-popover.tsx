import React, { useCallback, useEffect, useRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import FocusTrap from 'focus-trap-react';

import { Popover } from './leafygreen';
import { spacing } from '@leafygreen-ui/tokens';
import { palette } from '@leafygreen-ui/palette';
import { rgba } from 'polished';
import { useTheme, Theme } from '../hooks/use-theme';

const borderRadius = spacing[2];

const contentContainerStyles = css({
  display: 'flex',
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
  backgroundColor: palette.gray.dark3,
  color: palette.white,
});

type InteractivePopoverProps = {
  className: string;
  children: (childrenProps: { onClose: () => void }) => React.ReactElement;
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
  const { theme } = useTheme();
  const triggerRef = useRef<HTMLButtonElement>(null);
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

  const onPopoverKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        onClose();
        return;
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    document.addEventListener('keydown', onPopoverKeyDown);

    return () => {
      document.removeEventListener('keydown', onPopoverKeyDown);
    };
  }, [onPopoverKeyDown, open]);

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
              // TODO(COMPASS-6132):
              // 1. move the close buttons to be part of the component
              // 2. remove displayCheck: 'none'
              // 3. use the close button as `fallbackFocus`
              //
              // For context `displayCheck: 'none'` is necessary to make the trap work in JSDOM
              // and to avoid cases where failure to detect the tabbable element
              // would result in an exception.
              //
              // `displayCheck: 'none'` is not recommended and `fallbackFocus` is a much
              // better alternative that is also used in leafygreen, as it doesn't need to
              // disable the detection, still fixes the issues with JSDOM
              // and accidental race conditions with animations that may be present in the
              // content won't result in an exception.
              tabbableOptions: {
                displayCheck: 'none',
              },
            }}
          >
            <div
              className={cx(
                contentContainerStyles,
                theme === Theme.Dark
                  ? contentContainerStylesDark
                  : contentContainerStylesLight
              )}
              ref={popoverContentContainerRef}
            >
              {children({
                onClose: onClose,
              })}
            </div>
          </FocusTrap>
        )}
      </Popover>
    ),
  });
}

export { InteractivePopover };

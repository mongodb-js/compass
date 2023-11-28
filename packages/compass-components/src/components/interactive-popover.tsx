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
  className?: string;
  children: React.ReactNode;
  trigger: (triggerProps: {
    onClick: React.MouseEventHandler<HTMLButtonElement>;
    ref: React.LegacyRef<HTMLButtonElement>;
    children: React.ReactNode;
  }) => React.ReactElement;
  hideCloseButton?: boolean;
  customFocusTrapFallback?: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  /**
   * List of selector to consider contained elements to skip closing on click
   */
  containedElements?: string[];
  containerClassName?: string;
  closeButtonClassName?: string;
} & Pick<
  React.ComponentProps<typeof Popover>,
  'align' | 'justify' | 'spacing' | 'popoverZIndex'
>;

function InteractivePopover({
  className,
  children,
  trigger,
  hideCloseButton = false,
  customFocusTrapFallback = undefined,
  open,
  setOpen,
  containedElements = [],
  align,
  justify,
  spacing,
  popoverZIndex,
  containerClassName,
  closeButtonClassName,
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

  const onClickTrigger = useCallback(
    (event) => {
      if (open) {
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
        return;
      }

      setOpen(!open);
    },
    [open, setOpen, onClose, containedElements]
  );

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
        align={align ?? 'bottom'}
        justify={justify ?? 'start'}
        active={open}
        adjustOnMutation
        usePortal
        spacing={spacing ?? 0}
        className={className}
        refEl={triggerRef}
        popoverZIndex={popoverZIndex}
      >
        <FocusTrap
          active={open}
          focusTrapOptions={{
            clickOutsideDeactivates: true,
            // Tests fail without a fallback. (https://github.com/focus-trap/focus-trap-react/issues/91)
            fallbackFocus: customFocusTrapFallback || `#${closeButtonId}`,
          }}
        >
          <div
            className={cx(
              contentContainerStyles,
              darkMode
                ? contentContainerStylesDark
                : contentContainerStylesLight,
              containerClassName
            )}
            ref={popoverContentContainerRef}
          >
            {children}

            {!hideCloseButton && (
              <IconButton
                className={cx(closeButtonStyles, closeButtonClassName)}
                data-testid="interactive-popover-close-button"
                onClick={(evt) => {
                  evt.stopPropagation();
                  onClose();
                }}
                aria-label="Close"
                id={closeButtonId}
                ref={closeButtonRef}
              >
                <Icon glyph="X" />
              </IconButton>
            )}
          </div>
        </FocusTrap>
      </Popover>
    ),
  });
}

export { InteractivePopover };

import React, { useCallback, useEffect, useRef } from 'react';
import { css } from '@leafygreen-ui/emotion';
import FocusTrap from 'focus-trap-react';

import { Popover } from './leafygreen';

const contentContainerStyles = css({
  display: 'flex',
  height: '100%',
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
};

function InteractivePopover({
  className,
  children,
  trigger,
  open,
  setOpen,
}: InteractivePopoverProps): React.ReactElement {
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

      onClose();
    };
    window.addEventListener('mousedown', clickEventListener);
    window.addEventListener('touchstart', clickEventListener);
    return () => {
      window.removeEventListener('mousedown', clickEventListener);
      window.removeEventListener('touchstart', clickEventListener);
    };
  }, [open, onClose]);

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
            }}
          >
            <div
              className={contentContainerStyles}
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

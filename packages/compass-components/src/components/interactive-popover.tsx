import React, { useCallback, useEffect, useRef } from 'react';
import { css } from '@leafygreen-ui/emotion';
import FocusTrap from 'focus-trap-react';

import { Popover } from './leafygreen';

const contentContainerStyles = css({
  display: 'flex',
  height: '100%',
});

function useOnClickOutside(
  ref: React.RefObject<HTMLDivElement>,
  handler: (event: Event) => void
) {
  useEffect(() => {
    const clickEventListener = (event: MouseEvent | TouchEvent) => {
      // Ignore clicks on the ref.
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };
    document.addEventListener('mousedown', clickEventListener);
    document.addEventListener('touchstart', clickEventListener);
    return () => {
      document.removeEventListener('mousedown', clickEventListener);
      document.removeEventListener('touchstart', clickEventListener);
    };
  }, [ref, handler]);
}

type InteractivePopoverProps = {
  className: string;
  children: (childrenProps: {
    setOpen: (open: boolean) => void;
  }) => React.ReactElement;
  trigger: (triggerProps: {
    onClick: () => void;
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

  const onHide = useCallback(() => {
    setOpen(false);

    // Return focus to the trigger when the popover is hidden.
    setTimeout(() => {
      triggerRef.current?.focus();
    });
  }, [setOpen]);

  const onToggleOpen = useCallback(() => {
    if (open) {
      onHide();
      return;
    }

    setOpen(!open);
  }, [open, setOpen, onHide]);

  const onClickOutsidePopover = useCallback(
    (event) => {
      // Ignore clicks on the trigger as it has its own handler.
      if (
        !triggerRef.current ||
        triggerRef.current.contains(event.target as Node)
      ) {
        return;
      }
      onHide();
    },
    [triggerRef, onHide]
  );

  useOnClickOutside(popoverContentContainerRef, onClickOutsidePopover);

  const onPopoverKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (evt.key === 'Escape') {
        onHide();
        return;
      }
    },
    [onHide]
  );

  useEffect(() => {
    if (open) {
      window.addEventListener('keydown', onPopoverKeyDown);

      return () => {
        window.removeEventListener('keydown', onPopoverKeyDown);
      };
    }
  }, [onPopoverKeyDown, open]);

  return trigger({
    onClick: onToggleOpen,
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
          <FocusTrap>
            <div
              className={contentContainerStyles}
              ref={popoverContentContainerRef}
            >
              {children({
                setOpen: onToggleOpen,
              })}
            </div>
          </FocusTrap>
        )}
      </Popover>
    ),
  });
}

export { InteractivePopover };

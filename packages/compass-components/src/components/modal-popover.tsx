import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { transparentize } from 'polished';
import { spacing } from '@leafygreen-ui/tokens';
import { uiColors } from '@leafygreen-ui/palette';
import { Theme, useTheme } from '../hooks/use-theme';
import { InteractivePopover } from '..';
import { gray8 } from '../compass-ui-colors';

const borderRadius = spacing[2];

const contentContainerStyles = css({
  display: 'flex',
  height: '100%',
  alignItems: 'center',
  borderRadius: borderRadius,
  boxShadow: `0px 2px 4px -1px ${transparentize(0.85, uiColors.black)}`,
  border: `1px solid`,
  overflow: 'hidden',
  width: 'fit-content',
});

const contentContainerStylesLight = css({
  borderColor: uiColors.gray.light2,
  backgroundColor: gray8,
  color: uiColors.gray.dark2,
});

const contentContainerStylesDark = css({
  borderColor: uiColors.gray.dark2,
  backgroundColor: uiColors.gray.dark3,
  color: uiColors.white,
});

type ModalPopopverProps = {
  className: string;
  children: (childrenProps: { onClose: () => void }) => React.ReactElement;
  trigger: (triggerProps: {
    onClick: (event: React.MouseEvent | React.TouchEvent) => void;
    ref: React.RefObject<HTMLButtonElement>;
    children: React.ReactNode;
  }) => React.ReactElement;
  open: boolean;
  setOpen: (open: boolean) => void;
  onClose?: () => void;
};

function ModalPopover({
  className,
  children,
  trigger,
  open,
  // onClose,
  setOpen,
}: ModalPopopverProps): React.ReactElement {
  const { theme } = useTheme();

  return (
    <InteractivePopover
      className={className}
      trigger={trigger}
      open={open}
      setOpen={setOpen}
    >
      {({
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        onClose,
      }: {
        onClose: () => void;
      }) => {
        return (
          <div
            className={cx(
              contentContainerStyles,
              theme === Theme.Dark
                ? contentContainerStylesDark
                : contentContainerStylesLight
            )}
          >
            {children({ onClose })}
          </div>
        );
      }}
    </InteractivePopover>
  );
}

export { ModalPopover };

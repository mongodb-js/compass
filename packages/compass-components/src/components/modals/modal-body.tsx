import React, { forwardRef } from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { fontFamilies, spacing } from '@leafygreen-ui/tokens';
import { useDarkMode } from '../../hooks/use-theme';
import { ModalVariant } from './modal';

const contentStyle = css({
  padding: `0 ${spacing[5]}px`,
  paddingBottom: spacing[1], // space needed for the focus ring on the last field
  fontFamily: fontFamilies.default,
  fontSize: '13px',
  lineHeight: '20px',
  maxHeight: `calc(100vh - ${spacing[6] * 5}px)`,
  overflow: 'auto',

  '&:first-child': {
    paddingTop: spacing[5],
  },
});

const contentWithVariantStyles = css({
  paddingLeft: '78px',
});

// Leafygreen adds an upper border
// to the footer in dark mode
const darkModeStyle = css({
  paddingBottom: spacing[3],
});

type ModalBodyProps = {
  variant?: ModalVariant;
  className?: string;
  scroll?: boolean;
  minHeight?: number;
  children: React.ReactNode;
};

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(function ModalBody(
  {
    variant = ModalVariant.Default,
    className,
    scroll = true,
    minHeight,
    children,
  },
  ref
) {
  const darkMode = useDarkMode();

  const style: React.CSSProperties = {};

  if (minHeight) {
    style.minHeight = `${minHeight}px`;
  }
  if (scroll === false) {
    style.overflow = 'visible';
  }

  return (
    <div
      className={cx(
        contentStyle,
        variant !== ModalVariant.Default && contentWithVariantStyles,
        darkMode && darkModeStyle,
        className
      )}
      style={style}
      ref={ref}
    >
      {children}
    </div>
  );
});

export { ModalBody };

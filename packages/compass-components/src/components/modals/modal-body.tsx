import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { fontFamilies, spacing } from '@leafygreen-ui/tokens';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';
import { Styles } from 'polished/lib/types/style';

export const Variant = {
  Default: ButtonVariant.Primary,
  Danger: ButtonVariant.Danger,
} as const;

export type Variant = typeof Variant[keyof typeof Variant];

const contentStyle = css({
  padding: `0 ${spacing[5]}px`,
  paddingBottom: spacing[1], // space needed for the focus ring on the last field
  fontFamily: fontFamilies.default,
  fontSize: '13px',
  lineHeight: '20px',
  color: palette.black,
  maxHeight: `calc(100vh - ${spacing[6] * 5}px)`,
  overflow: 'auto',

  '&:first-child': {
    paddingTop: spacing[5],
  },
});

const variantStyle = {
  [Variant.Default]: css({}),
  [Variant.Danger]: css({
    paddingLeft: '78px',
  }),
};

type ModalBodyProps = {
  variant?: Variant;
  className?: string;
  scroll?: boolean;
  minHeight?: number;
  children: React.ReactNode;
};

function ModalBody({
  variant = Variant.Default,
  className,
  scroll = true,
  minHeight,
  children,
}: ModalBodyProps) {
  const style: React.CSSProperties = {};

  if (minHeight) {
    style.minHeight = `${minHeight}px`;
  }
  if (scroll === false) {
    style.overflow = 'visible';
  }

  return (
    <div
      className={cx(contentStyle, variantStyle[variant], className)}
      style={style}
    >
      {children}
    </div>
  );
}

export { ModalBody };

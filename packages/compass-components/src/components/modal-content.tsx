import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { fontFamilies, spacing } from '@leafygreen-ui/tokens';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';

export const Variant = {
  Default: ButtonVariant.Primary,
  Danger: ButtonVariant.Danger,
} as const;

export type Variant = typeof Variant[keyof typeof Variant];

const contentStyle = css({
  padding: `0 ${spacing[5]}px`,
  //paddingBottom: spacing[5],
  paddingBottom: spacing[1], // space needed for the focus ring on the last field
  fontFamily: fontFamilies.default,
  fontSize: '13px',
  lineHeight: '20px',
  color: palette.black,
  maxHeight: `calc(100vh - ${spacing[6] * 5}px)`,

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

type ModalContentProps = {
  variant?: Variant;
  scroll?: boolean;
  children: React.ReactNode;
};

function ModalContent({
  variant = Variant.Default,
  scroll = true,
  children,
}: ModalContentProps) {
  return (
    <div className={cx(
      contentStyle,
      variantStyle[variant],
      scroll && css({ overflow: 'auto' })
  )}>{children}</div>
  );
}

export { ModalContent };

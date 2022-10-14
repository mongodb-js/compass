import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors, palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';
import { withTheme } from '../hooks/use-theme';
import { Body, Icon } from './leafygreen';

export const Variant = {
  Default: ButtonVariant.Primary,
  Danger: ButtonVariant.Danger,
} as const;

export type Variant = typeof Variant[keyof typeof Variant];

const headerStyle = css({
  padding: spacing[5],
  paddingBottom: 0,
});

const variantStyle = {
  [Variant.Default]: css({}),
  [Variant.Danger]: css({
    paddingLeft: '78px',
  }),
};

const titleStyle = css({
  fontSize: '24px',
  fontWeight: 700,
  lineHeight: '32px',
  margin: 0,
  marginBottom: '10px',
  color: palette.black,
});

const warningIconStyles = css({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
  background: `${palette.red.light3}`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'absolute',
  left: '36px',
  top: '32px',

  svg: {
    marginTop: '-3px',
  },
});

type ModalHeaderProps = {
  title: string;
  subtitle?: string;
  variant?: Variant;
  darkMode?: boolean;
};

function UnthemedModalHeader({
  title,
  subtitle,
  variant = Variant.Default,
  darkMode,
}: ModalHeaderProps) {
  return (
    <div className={cx(headerStyle, variantStyle[variant])}>
      {variant === Variant.Danger && (
        <div className={cx(warningIconStyles)}>
          <Icon glyph="Warning" fill={palette.red.base} role="presentation" />
        </div>
      )}

      <h1
        className={cx(titleStyle, {
          [css({
            fontWeight: 'bold',
            lineHeight: '25px',
            color: uiColors.gray.light2,
          })]: darkMode,
        })}
      >
        {title}
      </h1>
      {subtitle && <Body>{subtitle}</Body>}
    </div>
  );
}

const ModalHeader = withTheme(UnthemedModalHeader);

export { ModalHeader };

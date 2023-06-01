import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors, palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';
import { Variant as ButtonVariant } from '@leafygreen-ui/button';

import { useDarkMode } from '../../hooks/use-theme';
import { Body, Icon } from '../leafygreen';

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

const titleStyleDark = css({
  fontWeight: 'bold',
  color: uiColors.gray.light2,
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

const warningIconStylesDark = css({
  background: `${palette.red.dark2}`,
});

type ModalHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  variant?: Variant;
};

function ModalHeader({
  title,
  subtitle,
  variant = Variant.Default,
}: ModalHeaderProps) {
  const darkMode = useDarkMode();

  return (
    <div className={cx(headerStyle, variantStyle[variant])}>
      {variant === Variant.Danger && (
        <div
          className={cx(warningIconStyles, darkMode && warningIconStylesDark)}
        >
          <Icon
            glyph="Warning"
            fill={darkMode ? palette.red.light3 : palette.red.base}
            role="presentation"
          />
        </div>
      )}
      <h1
        className={cx(titleStyle, darkMode && titleStyleDark)}
        data-testid="modal-title"
        id="modal-title"
      >
        {title}
      </h1>
      {subtitle && <Body>{subtitle}</Body>}
    </div>
  );
}

export { ModalHeader };

import React from 'react';
import { css, cx } from '@leafygreen-ui/emotion';
import { uiColors, palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { useDarkMode } from '../../hooks/use-theme';
import { Body, Icon } from '../leafygreen';
import { ModalVariant } from './modal';

const headerStyle = css({
  padding: spacing[5],
  paddingBottom: 0,
});

const headerWithVariantStyles = css({
  paddingLeft: '78px',
});

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

const iconStyles = css({
  width: '32px',
  height: '32px',
  borderRadius: '50%',
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

const variantLightStyles = {
  [ModalVariant.Danger]: css({
    background: `${palette.red.light3}`,
  }),
  [ModalVariant.Warn]: css({
    background: `${palette.yellow.light3}`,
  }),
};
const variantDarkStyles = {
  [ModalVariant.Danger]: css({
    background: `${palette.red.dark2}`,
  }),
  [ModalVariant.Warn]: css({
    background: `${palette.yellow.dark2}`,
  }),
};

const iconFillLight = {
  [ModalVariant.Danger]: palette.red.base,
  [ModalVariant.Warn]: palette.yellow.base,
};
const iconFillDark = {
  [ModalVariant.Danger]: palette.red.light3,
  [ModalVariant.Warn]: palette.yellow.light3,
};

type ModalHeaderProps = {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  variant?: ModalVariant;
};

function ModalHeader({
  title,
  subtitle,
  variant = ModalVariant.Default,
}: ModalHeaderProps) {
  const darkMode = useDarkMode();

  return (
    <div
      className={cx(
        headerStyle,
        variant !== ModalVariant.Default && headerWithVariantStyles
      )}
    >
      {variant !== ModalVariant.Default && (
        <div
          className={cx(
            iconStyles,
            darkMode ? variantDarkStyles[variant] : variantLightStyles[variant]
          )}
        >
          <Icon
            glyph="Warning"
            fill={darkMode ? iconFillDark[variant] : iconFillLight[variant]}
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

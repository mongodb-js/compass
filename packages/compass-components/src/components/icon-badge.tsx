import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css } from '@leafygreen-ui/emotion';
import { Variant } from '@leafygreen-ui/badge';

import { Badge, Icon } from './leafygreen';

const iconButtonStyles = css({
  padding: 0,
  background: 'transparent',
  border: 'none',
  lineHeight: 0,
  cursor: 'pointer',
});

const contentStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
});

type IconBadgeProps = {
  text: string;
  icon: string;
  dataTestId?: string;
  onClick: () => void;
  variant: Variant;
};

function IconBadge({
  text,
  icon,
  dataTestId,
  variant = Variant.DarkGray,
  onClick = () => null,
}: IconBadgeProps): React.ReactElement {
  return (
    <Badge data-testid={dataTestId} variant={variant}>
      <div className={contentStyles}>
        {text}
        {
          <button className={iconButtonStyles} onClick={onClick}>
            <Icon glyph={icon} />
          </button>
        }
      </div>
    </Badge>
  );
}

export default IconBadge;

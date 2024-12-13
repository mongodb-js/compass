import React from 'react';

import { Icon } from '../leafygreen';
import type { ItemActionButtonSize } from './constants';

// As we are using this component to render icon in MenuItem,
// and it does cloneElement on glyph, here we are accepting all the
// props that are passed during clone process.
type IconProps = React.ComponentProps<typeof Icon>;
type ActionGlyphProps = Omit<IconProps, 'size' | 'glyph'> & {
  glyph?: React.ReactChild;
  size?: ItemActionButtonSize;
};

export const ActionGlyph = ({ glyph, size, ...props }: ActionGlyphProps) => {
  if (typeof glyph === 'string') {
    return <Icon size={size} glyph={glyph} {...props} />;
  }

  if (React.isValidElement(glyph)) {
    return glyph;
  }

  return null;
};

import React, { forwardRef } from 'react';

import Card from '@mongodb-js/compass-components';
import { cx } from '@mongodb-js/compass-components';
import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { PolymorphicAs } from '@mongodb-js/compass-components';
import { Body } from '@mongodb-js/compass-components';

import {
  badgeAreaStyles,
  baseStyles,
  imageBackgroundStyles,
  richLinkTextClassName,
  themeStyles,
} from './RichLink.styles';
import { type RichLinkProps } from './RichLink.types';
import { RichLinkBadge } from './RichLinkBadge';
import { richLinkVariants } from './richLinkVariants';

export const RichLink = forwardRef<HTMLAnchorElement, RichLinkProps>(
  ({ darkMode: darkModeProp, onLinkClick, ...props }, ref) => {
    const { darkMode, theme } = shim_useDarkMode(darkModeProp);

    const richLinkVariantProps =
      'variant' in props && props.variant !== undefined
        ? richLinkVariants[props.variant]
        : {};

    const {
      children,
      imageUrl,
      badgeGlyph,
      badgeLabel,
      badgeColor,
      href,
      ...anchorProps
    } = {
      badgeGlyph: undefined,
      badgeLabel: undefined,
      badgeColor: undefined,
      ...richLinkVariantProps,
      ...props,
    };

    const showBadge = badgeLabel !== undefined;

    const showImageBackground = (imageUrl?.length ?? -1) > 0;

    const conditionalProps = href
      ? {
          as: 'a' as PolymorphicAs,
          href,
          ref: ref,
          target: '_blank',
          ...anchorProps,
        }
      : {};

    return (
      <Card
        darkMode={darkMode}
        className={cx(baseStyles, themeStyles[theme], {
          [badgeAreaStyles]: showBadge,
          [imageBackgroundStyles(imageUrl ?? '')]: showImageBackground,
        })}
        {...conditionalProps}
        onClick={() => onLinkClick?.(props)}
      >
        <Body className={richLinkTextClassName} darkMode={darkMode}>
          {children}
        </Body>
        {showBadge ? (
          <RichLinkBadge
            darkMode={darkMode}
            color={badgeColor}
            label={badgeLabel}
            glyph={badgeGlyph}
          />
        ) : null}
      </Card>
    );
  }
);

RichLink.displayName = 'RichLink';

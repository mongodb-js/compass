import React from 'react';
import {
  css,
  Badge,
  BadgeVariant,
  Icon,
  Link,
  uiColors,
  spacing,
  cx,
  focusRingStyles,
  focusRingVisibleStyles,
} from '@mongodb-js/compass-components';

const badgeStyles = css({
  gap: spacing[2],
});

const linkStyles = css({
  lineHeight: 0,
  color: uiColors.white,
  span: {
    // LG uses backgroundImage instead of textDecoration
    backgroundImage: 'none !important',
  },
  '&:focus': focusRingVisibleStyles,
});

type BadgeWithIconLinkProps = {
  text: string;
  link: string;
};

const BadgeWithIconLink: React.FunctionComponent<BadgeWithIconLinkProps> = ({
  text,
  link,
}) => {
  return (
    <Badge
      variant={BadgeVariant.DarkGray}
      className={cx(badgeStyles, focusRingStyles)}
      data-testid={`${text}-badge`}
    >
      {text}
      <Link
        hideExternalIcon
        aria-label={text}
        className={linkStyles}
        href={link}
      >
        <Icon glyph="InfoWithCircle" />
      </Link>
    </Badge>
  );
};

export default BadgeWithIconLink;

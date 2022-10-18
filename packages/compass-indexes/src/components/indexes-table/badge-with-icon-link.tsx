import React from 'react';
import {
  css,
  Badge,
  BadgeVariant,
  Icon,
  Link,
  palette,
  spacing,
  focusRing,
} from '@mongodb-js/compass-components';

const badgeStyles = css({
  gap: spacing[2],
});

const linkStyles = css(
  {
    lineHeight: 0,
    color: palette.white,
    span: {
      // LG uses backgroundImage instead of textDecoration
      backgroundImage: 'none !important',
    },
  },
  focusRing
);

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
      className={badgeStyles}
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

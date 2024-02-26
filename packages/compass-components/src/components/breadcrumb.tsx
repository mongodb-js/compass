import React from 'react';
import { spacing } from '@leafygreen-ui/tokens';
import { css, cx } from '@leafygreen-ui/emotion';
import { palette } from '@leafygreen-ui/palette';
import { useDarkMode } from '../hooks/use-theme';
import { Link, Icon, Body } from './leafygreen';

export type BreadcrumbItems = Array<{
  name: string;
  onClick: () => void;
}>;

const breadcrumbStyles = css({
  display: 'flex',
  gap: spacing[1],
  alignItems: 'center',
  height: spacing[4],
});

const dbLinkLightStyles = css({
  color: palette.green.dark2,
});

const dbLinkDarkStyles = css({
  color: palette.green.base,
});

const textStyles = css({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontWeight: 'bold',
});

const lastItemStylesLight = css({
  color: palette.gray.dark1,
});

const lastItemStylesDark = css({
  color: palette.gray.base,
});

export const Breadcrumbs = ({ items }: { items: BreadcrumbItems }) => {
  const darkMode = useDarkMode();
  return (
    <div className={breadcrumbStyles} data-testid="breadcrumbs">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        if (isLast) {
          return (
            <Body
              className={cx(
                textStyles,
                darkMode ? lastItemStylesDark : lastItemStylesLight
              )}
            >
              {item.name}
            </Body>
          );
        }
        return (
          <>
            <Link
              key={item.name}
              as="a"
              hideExternalIcon={true}
              className={cx(
                textStyles,
                darkMode ? dbLinkDarkStyles : dbLinkLightStyles
              )}
              onClick={item.onClick}
            >
              {item.name}
            </Link>
            <Icon
              glyph="ChevronRight"
              size="small"
              color={palette.gray.light1}
            />
          </>
        );
      })}
    </div>
  );
};

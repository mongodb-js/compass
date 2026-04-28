import React from 'react';
import getIndexHelpLink from '../../utils/index-link-helper';
import {
  Tooltip,
  Body,
  Link,
  Icon,
  css,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

import type { RegularIndex } from '../../modules/regular-indexes';
import BadgeWithIconLink from '../indexes-table/badge-with-icon-link';

const typeFieldStyles = css({
  display: 'flex',
  textTransform: 'capitalize',
  alignItems: 'center',
  gap: spacing[50],
  minWidth: spacing[1800],
});

export const canRenderTooltip = (type: string) => {
  return ['text', 'wildcard', 'columnstore'].indexOf(type ?? '') !== -1;
};

type TypeFieldProps = {
  // TODO(COMPASS-8335): we can remove unknown once we support type on
  // in-progress indexes
  type: RegularIndex['type'] | 'unknown';
  // in-progress and rolling indexes don't have extra
  extra?: RegularIndex['extra'];
  showBadge?: boolean;
};

export const IndexTypeTooltip: React.FunctionComponent<{
  extra: RegularIndex['extra'];
}> = ({ extra }) => {
  const allowedProps = [
    'weights',
    'default_language',
    'language_override',
    'wildcardProjection',
    'columnstoreProjection',
  ];
  const items: JSX.Element[] = [];
  for (const k in extra) {
    if (allowedProps.includes(k)) {
      items.push(<Body key={k}>{`${k}: ${JSON.stringify(extra[k])}`}</Body>);
    }
  }
  return <>{items}</>;
};

const TypeField: React.FunctionComponent<TypeFieldProps> = ({
  type,
  extra,
  showBadge = true,
}) => {
  const link = getIndexHelpLink(type) ?? '#';
  const darkMode = useDarkMode();
  const text = type ?? 'unknown';
  return (
    <Tooltip
      enabled={canRenderTooltip(type)}
      trigger={({
        children: tooltipChildren,
        ...tooltipTriggerProps
      }: React.HTMLProps<HTMLDivElement>) => (
        <div {...tooltipTriggerProps}>
          {showBadge ? (
            <BadgeWithIconLink text={text} link={link} />
          ) : (
            <div className={typeFieldStyles}>
              {text}
              <Link hideExternalIcon aria-label={text} href={link}>
                <Icon
                  glyph="InfoWithCircle"
                  fill={darkMode ? palette.gray.light1 : palette.gray.dark1}
                />
              </Link>
            </div>
          )}
          {tooltipChildren}
        </div>
      )}
    >
      {extra && <IndexTypeTooltip extra={extra} />}
    </Tooltip>
  );
};

export default TypeField;

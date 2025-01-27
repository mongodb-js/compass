import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Placeholder, css } from '@mongodb-js/compass-components';
import { ROW_HEIGHT } from './constants';
import { getTreeItemStyles } from './utils';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: ROW_HEIGHT,
  backgroundColor: 'var(--item-bg-color)',
  color: 'var(--item-color)',
});

const PLACEHOLDER_PROPS = {
  gradientStart: 'var(--item-bg-color-active)',
  gradientEnd: 'var(--item-bg-color)',
  style: { filter: 'brightness(0.98)' },
};

export const PlaceholderItem: React.FunctionComponent<{
  level: number;
  style?: CSSProperties;
}> = ({ level, style }) => {
  const itemPaddingStyles = useMemo(
    () => getTreeItemStyles({ level, isExpandable: false }),
    [level]
  );

  return (
    <div className={placeholderItem} style={{ ...style, ...itemPaddingStyles }}>
      <Placeholder {...PLACEHOLDER_PROPS} />
    </div>
  );
};

const topPlaceholderStyles = css({
  maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
});
export const TopPlaceholder = () => {
  const items = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => (
      <PlaceholderItem key={idx} level={1}></PlaceholderItem>
    ));
  }, []);
  return <div className={topPlaceholderStyles}>{items}</div>;
};

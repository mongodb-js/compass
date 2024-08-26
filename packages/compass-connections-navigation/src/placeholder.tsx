import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Placeholder, css } from '@mongodb-js/compass-components';
import { ROW_HEIGHT } from './constants';
import { getTreeItemStyles } from './utils';
import { usePreference } from 'compass-preferences-model/provider';

const placeholderItem = css({
  display: 'flex',
  alignItems: 'center',
  height: ROW_HEIGHT,
  backgroundColor: 'var(--item-bg-color)',
  color: 'var(--item-color)',
});

const MULTIPLE_CONNECTION_PROPS = {
  gradientStart: 'var(--item-bg-color-active)',
  gradientEnd: 'var(--item-bg-color)',
  style: { filter: 'brightness(0.98)' },
} as const;

export const PlaceholderItem: React.FunctionComponent<{
  level: number;
  style?: CSSProperties;
}> = ({ level, style }) => {
  const isSingleConnection = !usePreference('enableMultipleConnectionSystem');
  const itemPaddingStyles = useMemo(
    () => getTreeItemStyles({ level, isExpandable: false }),
    [level]
  );

  return (
    <div className={placeholderItem} style={{ ...style, ...itemPaddingStyles }}>
      <Placeholder {...(isSingleConnection ? {} : MULTIPLE_CONNECTION_PROPS)} />
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

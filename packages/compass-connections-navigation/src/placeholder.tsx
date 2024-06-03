import React, { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { Placeholder, css } from '@mongodb-js/compass-components';
import { ROW_HEIGHT } from './constants';
import { getTreeItemStyles } from './utils';
import { usePreference } from 'compass-preferences-model/provider';
import { getMaxNestingLevel } from './tree-data';

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
  maxNestingLevel: number;
  style?: CSSProperties;
}> = ({ level, maxNestingLevel, style }) => {
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const itemPaddingStyles = useMemo(
    () => getTreeItemStyles({ level, maxNestingLevel }),
    [level, maxNestingLevel]
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
  const isSingleConnection = !usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const items = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => (
      <PlaceholderItem
        key={idx}
        level={1}
        maxNestingLevel={getMaxNestingLevel(isSingleConnection)}
      ></PlaceholderItem>
    ));
  }, [isSingleConnection]);
  return <div className={topPlaceholderStyles}>{items}</div>;
};

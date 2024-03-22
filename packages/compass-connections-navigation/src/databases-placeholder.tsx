import { css } from '@mongodb-js/compass-components';
import React, { useMemo } from 'react';
import { PlaceholderItem } from './placeholder-item';

const placeholderList = css({
  maskImage: 'linear-gradient(to bottom, black 30%, transparent 95%)',
});

export const DatabasesPlaceholder: React.FunctionComponent = () => {
  const items = useMemo(() => {
    return Array.from({ length: 10 }, (_, idx) => (
      <PlaceholderItem key={idx} type="database"></PlaceholderItem>
    ));
  }, []);
  return <div className={placeholderList}>{items}</div>;
};

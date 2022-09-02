import React from 'react';

import {
  MongoDBLogo,
  css,
  cx,
  spacing,
  Subtitle,
  useTheme,
  Theme,
} from '@mongodb-js/compass-components';

const connectionsTitle = css({
  display: 'flex',
  alignItems: 'center',
  color: 'var(--title-color)',
  backgroundColor: 'var(--title-bg-color)',

  height: spacing[6] + spacing[1],
  padding: spacing[3],
});

const connectionsTitleText = css({
  color: 'var(--title-color)',
  marginTop: spacing[1],
  marginLeft: spacing[1],
});

export default function ConnectionsTitle({
  isExpanded
}: {
  isExpanded: boolean
}) {
  const { theme } = useTheme();

  return <div className={cx(connectionsTitle)}>
    <MongoDBLogo
      color={theme === Theme.Dark ? 'black' : 'white'}
      height={26}
    />
    {isExpanded && <Subtitle className={connectionsTitleText}>Compass</Subtitle>}
  </div>
}
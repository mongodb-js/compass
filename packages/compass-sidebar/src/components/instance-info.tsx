import React from 'react';

import { css, spacing, uiColors, Icon } from '@mongodb-js/compass-components';

const instanceInfo = css({
  border: 'none',
  borderTop: `1px solid ${uiColors.gray.light2}`,
  backgroundColor: uiColors.gray.light3,
  padding: `${spacing[2]}px ${spacing[3]}px`,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
});

const instanceIcon = css({
  fontSize: 0,
});

const instanceLabel = css({
  flexGrow: 1,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
  margin: `0 ${spacing[1]}px`,
});

function InstanceIcon({ glyph }: { glyph: string }) {
  return <span className={instanceIcon}><Icon size="default" glyph={glyph}></Icon></span>;
}

export default function InstanceInfo() {
  const label = 'Atlas MongoDB 6.0.0 Enterprise'; // TODO
  const glyph = 'ReplicaSet'; // TODO

  return (<button className={instanceInfo}>
    <InstanceIcon glyph={glyph}></InstanceIcon>
    <span className={instanceLabel} title={label}>{label}</span>
    <InstanceIcon glyph="ChevronRight"></InstanceIcon>
  </button>);
}

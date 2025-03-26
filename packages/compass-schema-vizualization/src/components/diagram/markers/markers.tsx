import React from 'react';
import { MarkerEndMany } from './marker-end-many';
import { MarkerEndOne } from './marker-end-one';
import { MarkerEndOneOrMany } from './marker-end-one-or-many';
import { MarkerStartOne } from './marker-start-one';
import { MarkerStartOneOrMany } from './marker-start-one-or-many';

export const Markers = () => {
  return (
    <svg>
      <defs>
        <MarkerEndMany isSelected={true} />
        <MarkerEndMany isSelected={false} />
        <MarkerEndOne isSelected={true} />
        <MarkerEndOne isSelected={false} />
        <MarkerEndOneOrMany isSelected={true} />
        <MarkerEndOneOrMany isSelected={false} />
        <MarkerStartOne isSelected={true} />
        <MarkerStartOne isSelected={false} />
        <MarkerStartOneOrMany isSelected={true} />
        <MarkerStartOneOrMany isSelected={false} />
      </defs>
    </svg>
  );
};

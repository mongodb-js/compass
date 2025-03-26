import React from 'react';
import type { NodeData } from '../utils/types';
import { EntityCard } from '../nodes/entity-card';

interface Props {
  data: NodeData;
  selected?: boolean;
}

export const TableNode = ({ data, selected }: Props) => {
  return <EntityCard type={'TABLE'} data={data} selected={selected} />;
};

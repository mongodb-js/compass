import React from 'react';
import type { NodeData } from '../utils/types';
import { EntityCard } from '../nodes/entity-card';
import styled from 'styled-components';

interface Props {
  data: NodeData;
  selected?: boolean;
}

const StyledCollectionNode = styled(EntityCard)`
    div {
    '::before': {
        position: absolute;
        display: block;
        height: 100%;
        background: ${(props) =>
          props.theme.shared.diagram.entityCard.mongoDBAccent};
        background: ${(props) =>
          props.theme.shared.diagram.entityCard.mongoDBAccent};
        width: 2px;
    },
    border-left: 1px solid ${(props) =>
      props.theme.shared.diagram.entityCard.mongoDBAccent};
    ':hover': {
        border-left: 1px solid ${(props) =>
          props.theme.shared.diagram.entityCard.mongoDBAccent};
    }
    }

`;

export const CollectionNode = ({ data, selected }: Props) => {
  return (
    <StyledCollectionNode type={'COLLECTION'} data={data} selected={selected} />
  );
};

import React from 'react';
import type { NodeData } from '../utils/types';
import styled from 'styled-components';

const StyledSimpleEntityCard = styled.div`
  display: flex;
  justify-content: center;
`;

const StyledSimpleEntityCardInner = styled.div`
  font-size: 20px;
  height: 22px;
  width: 220px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SimpleEntityCardContent = ({ title }: Pick<NodeData, 'title'>) => {
  return (
    <StyledSimpleEntityCard>
      <StyledSimpleEntityCardInner title={title}>
        {title}
      </StyledSimpleEntityCardInner>
    </StyledSimpleEntityCard>
  );
};

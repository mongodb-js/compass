import React from 'react';
import { spacing } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import styled from 'styled-components';

interface Props {
  depth: number;
}
const StyledNestedBorder = styled.div`
  padding-right: ${spacing[2]}px;
  height: ${spacing[3] + spacing[1]}px;
  border-left: 1px solid ${palette.gray.dark2};
`;

export const NestedBorder = (props: Props) => {
  return (
    <>
      {[...Array(props.depth)].map((_ignored, i) => (
        <StyledNestedBorder key={i} data-testid={`nested-border-depth-${i}`} />
      ))}
    </>
  );
};

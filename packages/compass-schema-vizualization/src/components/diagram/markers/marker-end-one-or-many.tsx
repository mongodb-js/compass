import React from 'react';
import { getMarkerId } from '../utils/utils';
import styled from 'styled-components';
import { palette } from '@mongodb-js/compass-components';

export type MarkerEndOneOrManyProps = {
  isSelected: boolean;
};

const svg = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M6 7V6.99515H6.00982L15 0.357803V1.6008L7.69345 6.99515H15V7V7.99515V8H7.68985L15 13.397V14.64L6.00622 8H6V8.00006H4V13H3V8.00006H0V8V7.00006V7H3V2H4V7H6Z"
    />
  </svg>
);

const Marker = styled(svg)<{ isSelected: boolean }>`
  fill: ${(props) =>
    props.isSelected ? palette.blue.base : palette.gray.base};
`;

export const MarkerEndOneOrMany = ({ isSelected }: MarkerEndOneOrManyProps) => {
  const id = getMarkerId(isSelected, 'END_ONE_OR_MANY');

  return (
    <marker
      data-testid={id}
      id={id}
      markerHeight="15"
      markerWidth="15"
      orient="auto"
      refX="10"
      refY="7.5"
    >
      <Marker isSelected={isSelected} />
    </marker>
  );
};

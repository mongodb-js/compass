import React from 'react';
// import AnchorStartOneOrMany from './assets/anchor-start-one-or-many.svg?react';
import { getMarkerId } from '../utils/utils';
import styled from 'styled-components';
import { palette } from '@mongodb-js/compass-components';

export type MarkerStartOneOrManyProps = {
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
      d="M9 7V6.99515H8.99018L0 0.357803V1.6008L7.30655 6.99515H0V7V7.99515V8H7.31015L0 13.397V14.64L8.99378 8H9V8.00006H11V13H12V8.00006H15V8V7.00006V7H12V2H11V7H9Z"
    />
  </svg>
);

const Marker = styled(svg)<{ isSelected: boolean }>`
  fill: ${(props) =>
    props.isSelected ? palette.blue.base : palette.gray.base};
`;

export const MarkerStartOneOrMany = ({
  isSelected,
}: MarkerStartOneOrManyProps) => {
  const id = getMarkerId(isSelected, 'START_ONE_OR_MANY');

  return (
    <marker
      data-testid={id}
      id={id}
      markerHeight="15"
      markerWidth="15"
      orient="auto"
      refX="5"
      refY="7.5"
    >
      <Marker isSelected={isSelected} />
    </marker>
  );
};

import React from 'react';
// import AnchorEndOne from './assets/anchor-end-one.svg?react';
import { getMarkerId } from '../utils/utils';
import styled from 'styled-components';
import { palette } from '@mongodb-js/compass-components';

export type MarkerEndOneProps = {
  isSelected: boolean;
};

const svg = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 8V13H3V8L0 8V7L3 7V2H4V7L15 7V8L4 8Z" />
  </svg>
);

const Marker = styled(svg)<{ isSelected: boolean }>`
  fill: ${(props) =>
    props.isSelected ? palette.blue.base : palette.gray.base};
`;

export const MarkerEndOne = ({ isSelected }: MarkerEndOneProps) => {
  const id = getMarkerId(isSelected, 'END_ONE');

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

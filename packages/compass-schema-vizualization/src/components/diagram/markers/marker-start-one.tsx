import React from 'react';
// import AnchorStartOne from './assets/anchor-start-one.svg?react';
import { getMarkerId } from '../utils/utils';
import styled from 'styled-components';
import { palette } from '@mongodb-js/compass-components';

export type MarkerStartOneProps = {
  isSelected: boolean;
};

const svg = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 15 15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M11 8V13H12V8L15 8V7L12 7V2H11V7L0 7V8L11 8Z" />
  </svg>
);

const Marker = styled(svg)<{ isSelected: boolean }>`
  fill: ${(props) =>
    props.isSelected ? palette.blue.base : palette.gray.base};
`;

export const MarkerStartOne = ({ isSelected }: MarkerStartOneProps) => {
  const id = getMarkerId(isSelected, 'START_ONE');

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

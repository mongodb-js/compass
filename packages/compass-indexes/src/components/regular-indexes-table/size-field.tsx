import React from 'react';
import { Body, Tooltip, compactBytes } from '@mongodb-js/compass-components';

type SizeFieldProps = {
  size: number;
  relativeSize: number;
};

export const formatSize = (size: number) => {
  const decimals = size <= 1000 ? 0 : 1;
  return compactBytes(size, true, decimals);
};

export const getSizeTooltip = (relativeSize: number): string => {
  return `${relativeSize.toFixed(2)}% compared to largest index`;
};

const SizeField: React.FunctionComponent<SizeFieldProps> = ({
  relativeSize,
  size,
}) => {
  return (
    <Tooltip trigger={<Body>{formatSize(size)}</Body>}>
      <Body>{getSizeTooltip(relativeSize)}</Body>
    </Tooltip>
  );
};

export default SizeField;

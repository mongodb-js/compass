import numeral from 'numeral';
import React from 'react';
import { Body, Tooltip } from '@mongodb-js/compass-components';

type SizeFieldProps = {
  darkMode?: boolean;
  size: number;
  relativeSize: number;
};

export const formatSize = (size: number) => {
  const precision = size <= 1000 ? '0' : '0.0';
  return numeral(size).format(precision + ' b');
};

export const getSizeTooltip = (relativeSize: number): string => {
  return `${relativeSize.toFixed(2)}% compared to largest index`;
};

const SizeField: React.FunctionComponent<SizeFieldProps> = ({
  darkMode,
  relativeSize,
  size,
}) => {
  return (
    <Tooltip
      darkMode={darkMode}
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <Body>{formatSize(size)}</Body>
        </span>
      )}
    >
      <Body>{getSizeTooltip(relativeSize)}</Body>
    </Tooltip>
  );
};

export default SizeField;

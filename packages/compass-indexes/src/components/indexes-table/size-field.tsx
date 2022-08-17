import numeral from 'numeral';
import React from 'react';
import { Body, Tooltip } from '@mongodb-js/compass-components';

type SizeFieldProps = {
  size: number;
  relativeSize: number;
};

const format = (size: number) => {
  const precision = size <= 1000 ? '0' : '0.0';
  return numeral(size).format(precision + ' b');
};

const SizeField: React.FunctionComponent<SizeFieldProps> = ({
  relativeSize,
  size,
}) => {
  const indexSize = format(size);
  const tooltip = `${relativeSize.toFixed(2)}% compared to largest index`;
  return (
    <Tooltip
      trigger={({ children, ...props }) => (
        <span {...props}>
          {children}
          <Body>{indexSize}</Body>
        </span>
      )}
    >
      <Body>{tooltip}</Body>
    </Tooltip>
  );
};

export default SizeField;

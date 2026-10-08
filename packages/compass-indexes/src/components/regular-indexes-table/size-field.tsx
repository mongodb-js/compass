import React from 'react';
import {
  Body,
  Tooltip,
  compactBytes,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import { translateToEnglish } from '../../utils/get-translate';

type SizeFieldProps = {
  size: number;
  relativeSize: number;
};

export const formatSize = (size: number) => {
  const decimals = size <= 1000 ? 0 : 1;
  return compactBytes(size, true, decimals);
};

export const getSizeTooltip = (
  relativeSize: number,
  t: TranslateFn = translateToEnglish
): string => {
  return t(
    'indexes.sizeField.tooltip',
    '{percent}% compared to largest index',
    { percent: relativeSize.toFixed(2) }
  );
};

const SizeField: React.FunctionComponent<SizeFieldProps> = ({
  relativeSize,
  size,
}) => {
  const t = useTranslation();
  return (
    <Tooltip trigger={<Body>{formatSize(size)}</Body>}>
      <Body>{getSizeTooltip(relativeSize, t)}</Body>
    </Tooltip>
  );
};

export default SizeField;

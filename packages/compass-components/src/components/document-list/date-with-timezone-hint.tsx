import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';

import { InlineDefinition } from '../inline-definition';
import { useBSONDisplayOptions } from './bson-display-options-context';
import { formatBSONDate } from '../../utils/format-bson-date';

// We are not adding any gap here. When the content wraps in the next line, the
// gap will create extra space and we want to avoid that, and that's why we are
// adding paddingRight to the date value instead.
const containerStyles = css({
  display: 'inline-flex',
  flexWrap: 'wrap',
});

const valueStyles = css({
  display: 'inline-flex',
  paddingRight: '8px',
});

export function DateWithTimezoneHint({
  value,
  children,
}: {
  value: Date | number | string;
  children: React.ReactNode;
}) {
  const { timezone } = useBSONDisplayOptions(['timezone']);
  const timezoneFormattedValue = useMemo(() => {
    return formatBSONDate(value, timezone);
  }, [value, timezone]);

  return (
    <span className={containerStyles}>
      <span className={valueStyles}>{children}</span>
      <InlineDefinition
        title={timezoneFormattedValue}
        definition="This personal timezone display preference may be configured in Compass Settings."
      >
        {timezoneFormattedValue}
      </InlineDefinition>
    </span>
  );
}

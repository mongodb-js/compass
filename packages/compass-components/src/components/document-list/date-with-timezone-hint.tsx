import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';

import { InlineDefinition } from '../inline-definition';
import { useBSONDisplayOptions } from './bson-display-options-context';

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Exported for tests only.
 * @internal
 */
export function formatDateWithTimezone(
  value: Date | number | string,
  timezone = 'UTC',
  locale?: string
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.valueOf())) {
    return 'Invalid Date';
  }

  const timeZone = isValidTimezone(timezone) ? timezone : 'UTC';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: 'long',
      timeStyle: 'long',
    }).format(date);
  } catch {
    return 'Invalid Date';
  }
}

// We are not adding any gap here. When the content wraps in the next line, the
// gap will create extra space and we want to avoid that, and that's why we are
// adding paddingRight to the children instead.
const containerStyles = css({
  display: 'inline-flex',
  flexWrap: 'wrap',
});

const valueStyles = css({
  display: 'inline-flex',
  paddingRight: '8px',
});

const dateWithTimezoneHintStyles = css({
  userSelect: 'none',
});

export function DateWithTimezoneHint({
  value,
  children,
}: {
  value: Date | number | string;
  children: React.ReactNode;
}) {
  const { timezone } = useBSONDisplayOptions();
  const timezoneFormattedValue = useMemo(() => {
    return formatDateWithTimezone(value, timezone);
  }, [value, timezone]);
  return (
    <div className={containerStyles}>
      <div className={valueStyles}>{children}</div>
      <InlineDefinition
        className={dateWithTimezoneHintStyles}
        data-testid="date-with-timezone-hint"
        definition="This personal timezone display preference may be configured in Compass Settings."
      >
        {timezoneFormattedValue}
      </InlineDefinition>
    </div>
  );
}

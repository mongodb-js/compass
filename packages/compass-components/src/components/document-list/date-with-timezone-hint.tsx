import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';

import { InlineDefinition } from '../inline-definition';
import { useBSONDisplayOptions } from './bson-display-options-context';
import { bsonValueDisplayVar } from './bson-utils';

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

// Laid out as inline text rather than as a flex row: flex boxes get their own
// line when copied, and inline text wraps the hint onto its own line for free.
// The gap is paddingRight on the value so that wrapping doesn't leave extra
// space behind.
const containerStyles = css({
  display: 'inline',
  whiteSpace: 'normal',
  [bsonValueDisplayVar]: 'inline',
});

const valueStyles = css({
  display: 'inline',
  paddingRight: '8px',
});

const dateWithTimezoneHintStyles = css({
  userSelect: 'none',
  whiteSpace: 'nowrap',
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
    <span className={containerStyles}>
      <span className={valueStyles}>{children}</span>
      <wbr />
      <InlineDefinition
        className={dateWithTimezoneHintStyles}
        data-testid="date-with-timezone-hint"
        definition="This personal timezone display preference may be configured in Compass Settings."
      >
        {timezoneFormattedValue}
      </InlineDefinition>
    </span>
  );
}

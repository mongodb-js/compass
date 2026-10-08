import React, { useMemo } from 'react';
import { css } from '@leafygreen-ui/emotion';

import { InlineDefinition } from '../inline-definition';
import { useBSONDisplayOptions } from './bson-display-options-context';
import { bsonValueDisplayVar } from './bson-utils';
import { useTranslation } from '../../i18n';

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
  locale?: string,
  invalidDateLabel = 'Invalid Date'
): string {
  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.valueOf())) {
    return invalidDateLabel;
  }

  const timeZone = isValidTimezone(timezone) ? timezone : 'UTC';
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone,
      dateStyle: 'long',
      timeStyle: 'long',
    }).format(date);
  } catch {
    return invalidDateLabel;
  }
}

// Inline styles to make things more easily copy-pasteable.
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
});

export function DateWithTimezoneHint({
  value,
  children,
}: {
  value: Date | number | string;
  children: React.ReactNode;
}) {
  const t = useTranslation();
  const { timezone } = useBSONDisplayOptions();
  const timezoneFormattedValue = useMemo(() => {
    return formatDateWithTimezone(
      value,
      timezone,
      undefined,
      t('components.dateWithTimezoneHint.invalidDate', 'Invalid Date')
    );
  }, [value, timezone, t]);
  return (
    <span className={containerStyles}>
      <span className={valueStyles}>{children}</span>
      <wbr />
      <InlineDefinition
        className={dateWithTimezoneHintStyles}
        data-testid="date-with-timezone-hint"
        definition={t(
          'components.dateWithTimezoneHint.definition',
          'This personal timezone display preference may be configured in Compass Settings.'
        )}
      >
        {timezoneFormattedValue}
      </InlineDefinition>
    </span>
  );
}

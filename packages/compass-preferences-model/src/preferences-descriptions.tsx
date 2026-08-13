import React from 'react';
import {
  css,
  Link,
  InlineDefinition,
  Icon,
  spacing,
} from '@mongodb-js/compass-components';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: '8px',
});

const timezoneDaylightSavingsStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

function observesDaylightSavings(timeZone: string): boolean {
  const year = new Date().getFullYear();

  const january = new Date(Date.UTC(year, 0, 1));
  const july = new Date(Date.UTC(year, 6, 1));

  const getOffset = (date: Date) => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    }).formatToParts(date);
    return parts.find((p) => p.type === 'timeZoneName')?.value;
  };

  return getOffset(january) !== getOffset(july);
}

export function TimezoneDescription({ value }: { value: string }) {
  return (
    <div className={containerStyles}>
      <span>The data will still always be stored in UTC.</span>
      {observesDaylightSavings(value) && (
        <InlineDefinition
          className={timezoneDaylightSavingsStyles}
          tooltipProps={{ align: 'top', justify: 'start' }}
          definition="This timezone observes daylight savings."
        >
          <Icon glyph="Sun" />
          Observes daylight saving
        </InlineDefinition>
      )}
    </div>
  );
}

export function EnableDbAndCollStatsDescription() {
  return (
    <>
      When enabled, Compass occasionally calls the{' '}
      <Link href="https://www.mongodb.com/docs/manual/reference/command/dbStats/#mongodb-dbcommand-dbcmd.dbStats">
        dbStats
      </Link>
      and{' '}
      <Link href="https://www.mongodb.com/docs/manual/reference/command/collStats/">
        collStats
      </Link>{' '}
      commands to access storage statistics for a given database or collection.
      Disabling this setting can help reduce Compass&apos; overhead on your
      MongoDB deployments.
    </>
  );
}

export function DefaultSortDescription() {
  return (
    <>
      All queries executed from the query bar will apply this sort.{' '}
      <strong>Not available for views and timeseries.</strong>
    </>
  );
}

export function EnableGenAIToolCallingDescription() {
  return (
    <>
      Allow the MongoDB Assistant to interact with your databases. All actions
      require your approval before running. Learn more about{' '}
      <Link
        href="https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/"
        target="_blank"
      >
        MongoDB database tools
      </Link>
    </>
  );
}

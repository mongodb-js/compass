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

export function TimezoneDescription() {
  return (
    <div className={containerStyles}>
      <span>The data will still always be stored in UTC.</span>
      <InlineDefinition
        className={timezoneDaylightSavingsStyles}
        tooltipProps={{ align: 'top', justify: 'start' }}
        definition="This icon indicates that a timezone observes daylight savings."
      >
        <Icon glyph="Sun" />
        Observes daylight saving
      </InlineDefinition>
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

import React from 'react';
import {
  css,
  Link,
  InlineDefinition,
  Icon,
  spacing,
} from '@mongodb-js/compass-components';
import type { UserConfigurablePreferences } from 'compass-preferences-model';
import { timezoneObservesDaylightSavings } from 'compass-preferences-model/provider';
import type { SupportedPreferences } from './settings/settings-list';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  gap: spacing[200],
});

const timezoneDaylightSavingsStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

export type PreferencesDescriptionProps<
  K extends keyof UserConfigurablePreferences
> = {
  value: UserConfigurablePreferences[K] | undefined;
};

export function TimezoneDescription({
  value,
}: PreferencesDescriptionProps<'timezone'>) {
  return (
    <div className={containerStyles} data-testid="timezone-description">
      <span>The data will still always be stored in UTC.</span>
      {!!value && timezoneObservesDaylightSavings(value) && (
        <InlineDefinition
          className={timezoneDaylightSavingsStyles}
          tooltipProps={{ align: 'top', justify: 'start' }}
          definition="This timezone observes daylight savings."
        >
          <Icon glyph="Sun" />
          Observes daylight savings
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
      </Link>{' '}
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

export type SettingsDescriptionComponent<K extends SupportedPreferences> =
  React.ComponentType<PreferencesDescriptionProps<K>>;

type SettingsDescriptionsMap = {
  [K in SupportedPreferences]?: SettingsDescriptionComponent<K>;
};

export const SETTINGS_DESCRIPTIONS_MAP: SettingsDescriptionsMap = {
  enableDbAndCollStats: EnableDbAndCollStatsDescription,
  defaultSortOrder: DefaultSortDescription,
  enableGenAIToolCalling: EnableGenAIToolCallingDescription,
  timezone: TimezoneDescription,
};

import React from 'react';
import {
  css,
  Link,
  InlineDefinition,
  Icon,
  spacing,
  useTranslation,
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
  K extends keyof UserConfigurablePreferences,
> = {
  value: UserConfigurablePreferences[K] | undefined;
};

export function TimezoneDescription({
  value,
}: PreferencesDescriptionProps<'timezone'>) {
  const t = useTranslation();
  return (
    <div className={containerStyles} data-testid="timezone-description">
      <span>
        {t(
          'settings.desc.timezone.utc',
          'The data will still always be stored in UTC.'
        )}
      </span>
      {!!value && timezoneObservesDaylightSavings(value) && (
        <InlineDefinition
          className={timezoneDaylightSavingsStyles}
          tooltipProps={{ align: 'top', justify: 'start' }}
          definition={t(
            'settings.desc.timezone.dstTooltip',
            'This timezone observes daylight savings.'
          )}
        >
          <Icon glyph="Sun" />
          {t('settings.desc.timezone.dst', 'Observes daylight savings')}
        </InlineDefinition>
      )}
    </div>
  );
}

export function EnableDbAndCollStatsDescription() {
  const t = useTranslation();
  return (
    <>
      {t(
        'settings.desc.dbStats.before',
        'When enabled, Compass occasionally calls the'
      )}{' '}
      <Link href="https://www.mongodb.com/docs/manual/reference/command/dbStats/#mongodb-dbcommand-dbcmd.dbStats">
        dbStats
      </Link>{' '}
      {t('settings.desc.dbStats.and', 'and')}{' '}
      <Link href="https://www.mongodb.com/docs/manual/reference/command/collStats/">
        collStats
      </Link>{' '}
      {t(
        'settings.desc.dbStats.after',
        "commands to access storage statistics for a given database or collection. Disabling this setting can help reduce Compass' overhead on your MongoDB deployments."
      )}
    </>
  );
}

export function DefaultSortDescription() {
  const t = useTranslation();
  return (
    <>
      {t(
        'settings.desc.defaultSort.main',
        'All queries executed from the query bar will apply this sort.'
      )}{' '}
      <strong>
        {t(
          'settings.desc.defaultSort.note',
          'Not available for views and timeseries.'
        )}
      </strong>
    </>
  );
}

export function EnableGenAIToolCallingDescription() {
  const t = useTranslation();
  return (
    <>
      {t(
        'settings.desc.toolCalling.main',
        'Allow the MongoDB Assistant to interact with your databases. All actions require your approval before running. Learn more about'
      )}{' '}
      <Link
        href="https://www.mongodb.com/docs/compass/query-with-natural-language/compass-ai-assistant/"
        target="_blank"
      >
        {t('settings.desc.toolCalling.link', 'MongoDB database tools')}
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

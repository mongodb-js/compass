import React from 'react';
import { useTranslation } from 'react-i18next';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';

type StateKey = 'set-cli' | 'set-global' | 'hardcoded' | 'derived' | '';

const STATE_TRANSLATION_KEYS: Record<
  Exclude<StateKey, ''>,
  string
> = Object.assign(Object.create(null) as object, {
  'set-cli': 'stateSetCli',
  'set-global': 'stateSetGlobal',
  hardcoded: 'stateHardcoded',
  derived: 'stateDerived',
});

export const SettingStateLabel: React.FunctionComponent<{
  state: StateKey | undefined;
}> = ({ state }) => {
  const { t } = useTranslation('compassSettings');
  if (!state) {
    return null;
  }
  return (
    <Banner variant={BannerVariant.Info} data-testid={`${state}-banner`}>
      {t(STATE_TRANSLATION_KEYS[state])}
    </Banner>
  );
};

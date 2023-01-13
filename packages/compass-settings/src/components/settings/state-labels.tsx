import React from 'react';
import { Banner, BannerVariant } from '@mongodb-js/compass-components';

export const settingStateLabels = {
  'set-cli': (
    <Banner variant={BannerVariant.Info} data-testid="set-cli-banner">
      This setting cannot be modified as it has been set at Compass startup.
    </Banner>
  ),
  'set-global': (
    <Banner variant={BannerVariant.Info} data-testid="set-global-banner">
      This setting cannot be modified as it has been set in the global Compass
      configuration file.
    </Banner>
  ),
  hardcoded: (
    <Banner variant={BannerVariant.Info} data-testid="hardcoded-banner">
      This setting cannot be modified as it is disabled for this Compass
      edition.
    </Banner>
  ),
  derived: (
    <Banner variant={BannerVariant.Info} data-testid="derived-banner">
      This setting cannot be modified as its value is implied by another option.
    </Banner>
  ),
  '': null,
};

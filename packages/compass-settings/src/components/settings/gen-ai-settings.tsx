import React from 'react';
import SettingsList from './settings-list';
import { useIsAIFeatureEnabled } from 'compass-preferences-model/provider';
import { ConnectedAtlasLoginSettings } from './atlas-login';
import { css, spacing } from '@mongodb-js/compass-components';

import { connect } from 'react-redux';
import type { UserPreferences } from 'compass-preferences-model';
import { withPreferences } from 'compass-preferences-model/provider';

import type { RootState } from '../../stores';

const atlasSettingsContainerStyles = css({
  marginTop: spacing[3],
});

export const GenAISettings: React.FunctionComponent<{
  isAIFeatureRolledOutToUser?: boolean;
}> = ({ isAIFeatureRolledOutToUser }) => {
  const aiFeatureEnabled = useIsAIFeatureEnabled();

  return (
    <div data-testid="gen-ai-settings">
      {isAIFeatureRolledOutToUser && (
        <>
          <div>
            Compass users with MongoDB Atlas accounts enjoy access to an
            extended set of generative AI functionality, starting with natural
            language processing for quicker query and aggregation authoring.
          </div>
          <SettingsList fields={['enableGenAIFeatures']} />
        </>
      )}

      {aiFeatureEnabled && (
        <div className={atlasSettingsContainerStyles}>
          <ConnectedAtlasLoginSettings></ConnectedAtlasLoginSettings>
        </div>
      )}
    </div>
  );
};

export default withPreferences(
  connect(
    (
      state: RootState,
      ownProps: {
        cloudFeatureRolloutAccess?: UserPreferences['cloudFeatureRolloutAccess'];
      }
    ) => {
      return {
        isAIFeatureRolledOutToUser:
          ownProps.cloudFeatureRolloutAccess?.GEN_AI_COMPASS,
      };
    }
  )(GenAISettings),
  ['cloudFeatureRolloutAccess']
);

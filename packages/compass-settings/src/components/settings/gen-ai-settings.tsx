import React from 'react';
import SettingsList from './settings-list';
import { useIsAIFeatureEnabled } from 'compass-preferences-model/provider';
import { ConnectedAtlasLoginSettings } from './atlas-login';
import { css, spacing } from '@mongodb-js/compass-components';

const atlasSettingsContainerStyles = css({
  marginTop: spacing[3],
});

export const GenAISettings: React.FunctionComponent = () => {
  const aiFeatureEnabled = useIsAIFeatureEnabled();

  return (
    <div data-testid="gen-ai-settings">
      <div>
        Compass users with MongoDB Atlas accounts enjoy access to an extended
        set of generative AI functionality, starting with natural language
        processing for quicker query and aggregation authoring.
      </div>
      <SettingsList fields={['enableGenAIFeatures']} />

      {aiFeatureEnabled && (
        <div className={atlasSettingsContainerStyles}>
          <ConnectedAtlasLoginSettings></ConnectedAtlasLoginSettings>
        </div>
      )}
    </div>
  );
};

export default GenAISettings;

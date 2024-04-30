import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../stores';
import SettingsList from './settings-list';
import { ConnectedAtlasLoginSettings } from './atlas-login';
import { useShouldShowDevFeatures } from './feature-preview';

const atlasSettingsContainerStyles = css({
  marginTop: spacing[3],
});

export const GenAISettings: React.FunctionComponent<{
  isAIFeatureEnabled: boolean;
}> = ({ isAIFeatureEnabled }) => {
  const showDevFeatureFlags = useShouldShowDevFeatures();

  return (
    <div data-testid="gen-ai-settings">
      <div>
        Compass users with MongoDB Atlas accounts enjoy access to an extended
        set of generative AI functionality, starting with natural language
        processing for quicker query and aggregation authoring.
      </div>
      <SettingsList fields={['enableGenAIFeatures']} />

      {isAIFeatureEnabled && (
        <>
          <div className={atlasSettingsContainerStyles}>
            <ConnectedAtlasLoginSettings></ConnectedAtlasLoginSettings>
          </div>
          {/* TODO(COMPASS-7865): We're currently sending our sample field values to the server
            and into the ai prompt as regular JSON. This means the AI isn't generating good
            results with certain bson types. It'll take a bit of work server
            side for us to do this. In the meantime we are hiding this setting (dev only). */}
          {showDevFeatureFlags && (
            <SettingsList fields={['enableGenAISampleDocumentPassing']} />
          )}
        </>
      )}
    </div>
  );
};

const mapState = (state: RootState) => ({
  isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
});

export default connect(mapState, null)(GenAISettings);

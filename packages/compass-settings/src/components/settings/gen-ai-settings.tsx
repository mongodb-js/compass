import React from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../../stores';
import SettingsList from './settings-list';

export const GenAISettings: React.FunctionComponent<{
  isAIFeatureEnabled: boolean;
  isToolCallingEnabled: boolean;
}> = ({ isAIFeatureEnabled, isToolCallingEnabled }) => {
  return (
    <div data-testid="gen-ai-settings">
      <div>Provides access to advanced generative AI capabilities.</div>
      <SettingsList fields={['enableGenAIFeatures']} />

      {isAIFeatureEnabled && (
        <>
          <SettingsList fields={['enableGenAISampleDocumentPassing']} />
          {isToolCallingEnabled && (
            <SettingsList fields={['enableGenAIDatabaseToolCalling']} />
          )}
        </>
      )}
    </div>
  );
};

const mapState = (state: RootState) => ({
  isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
  isToolCallingEnabled: !!state.settings.settings.enableToolCalling,
});

export default connect(mapState, null)(GenAISettings);

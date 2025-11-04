import React from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../../stores';
import SettingsList from './settings-list';

export const GenAISettings: React.FunctionComponent<{
  isAIFeatureEnabled: boolean;
}> = ({ isAIFeatureEnabled }) => {
  return (
    <div data-testid="gen-ai-settings">
      <div>Provides access to advanced generative AI capabilities.</div>
      <SettingsList fields={['enableGenAIFeatures']} />

      {isAIFeatureEnabled && (
        <>
          <SettingsList fields={['enableGenAISampleDocumentPassing']} />
          <SettingsList fields={['enableMcpServer']} />
        </>
      )}
    </div>
  );
};

const mapState = (state: RootState) => ({
  isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
});

export default connect(mapState, null)(GenAISettings);

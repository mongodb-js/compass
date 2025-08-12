import React from 'react';
import { connect } from 'react-redux';

import type { RootState } from '../../stores';
import SettingsList from './settings-list';

export const GenAISettings: React.FunctionComponent<{
  isAIFeatureEnabled: boolean;
}> = ({ isAIFeatureEnabled }) => {
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
          <SettingsList fields={['enableGenAISampleDocumentPassing']} />
        </>
      )}
    </div>
  );
};

const mapState = (state: RootState) => ({
  isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
});

export default connect(mapState, null)(GenAISettings);

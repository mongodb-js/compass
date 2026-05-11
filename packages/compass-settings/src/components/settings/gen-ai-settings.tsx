import React from 'react';
import { connect } from 'react-redux';
import { css, spacing } from '@mongodb-js/compass-components';

import type { RootState } from '../../stores';
import SettingsList from './settings-list';
import McpServerSettings from './mcp-server-settings';

const dividerStyles = css({
  borderTop: '1px solid',
  borderColor: 'var(--leafygreen-ui-colors-gray-light2, #E8EDEB)',
  marginTop: spacing[4],
  marginBottom: spacing[4],
});

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
            <SettingsList fields={['enableGenAIToolCalling']} />
          )}
        </>
      )}

      <div className={dividerStyles} />
      <McpServerSettings />
    </div>
  );
};

const mapState = (state: RootState) => ({
  isAIFeatureEnabled: !!state.settings.settings.enableGenAIFeatures,
  isToolCallingEnabled: !!state.settings.settings.enableToolCalling,
});

export default connect(mapState, null)(GenAISettings);

import React from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

import type { RootState } from '../../stores';
import SettingsList from './settings-list';

export const GenAISettings: React.FunctionComponent<{
  isAIFeatureEnabled: boolean;
  isToolCallingEnabled: boolean;
}> = ({ isAIFeatureEnabled, isToolCallingEnabled }) => {
  const { t } = useTranslation('compassSettings');
  return (
    <div data-testid="gen-ai-settings">
      <div>{t('genAiIntro')}</div>
      <SettingsList fields={['enableGenAIFeatures']} />

      {isAIFeatureEnabled && (
        <>
          <SettingsList fields={['enableGenAISampleDocumentPassing']} />
          {isToolCallingEnabled && (
            <SettingsList fields={['enableGenAIToolCalling']} />
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

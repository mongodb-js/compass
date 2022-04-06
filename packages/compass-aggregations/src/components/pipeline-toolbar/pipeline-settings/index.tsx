import React from 'react';
import { connect } from 'react-redux';
import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';

import { SaveMenu, CreateMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';

const containerStyles = css({
  display: 'grid',
  gap: spacing[2],
  gridTemplateAreas: '"settings extraSettings"',
  alignItems: 'center',
  whiteSpace: 'nowrap',
});
const settingsStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const extraSettingsStyles = css({
  gridArea: 'extraSettings',
  justifySelf: 'end',
  display: 'flex',
});

type PipelineSettingsProps = {
  onExportToLanguage: () => void;
};

export const PipelineSettings: React.FunctionComponent<PipelineSettingsProps> =
  ({ onExportToLanguage }) => {
    return (
      <div className={containerStyles} data-testid="pipeline-settings">
        <div className={settingsStyles}>
          <PipelineName />
          <SaveMenu />
          <CreateMenu />
          <Button
            variant="primaryOutline"
            size="xsmall"
            leftGlyph={<Icon glyph={'Export'} />}
            onClick={() => onExportToLanguage()}
            data-testid="pipeline-toolbar-export-button"
          >
            Export to language
          </Button>
        </div>
        <div className={extraSettingsStyles}>
          <PipelineExtraSettings />
        </div>
      </div>
    );
  };

export default connect(null, {
  onExportToLanguage: exportToLanguage,
})(PipelineSettings);

import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
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
});
const settingsStyles = css({
  gridArea: 'settings',
  display: 'grid',
  gap: spacing[2],
  gridTemplateAreas: '"name saveMenu createMenu exportButton"',
  justifyContent: 'start',
});
const nameStyles = css({
  gridArea: 'name',
});
const saveMenuStyles = css({
  gridArea: 'saveMenu',
});
const createMenuStyles = css({
  gridArea: 'createMenu',
});
const exportButtonStyles = css({
  gridArea: 'exportButton',
});
const extraSettingsStyles = css({
  gridArea: 'extraSettings',
  justifySelf: 'end',
});

const PipelineSettings: React.FunctionComponent<PipelineSettingsProps> = ({
  onExportToLanguage,
}) => {
  return (
    <div className={containerStyles} data-testid="pipeline-settings">
      <div className={settingsStyles}>
        <div className={nameStyles}>
          <PipelineName />
        </div>
        <div className={saveMenuStyles}>
          <SaveMenu />
        </div>
        <div className={createMenuStyles}>
          <CreateMenu />
        </div>
        <div className={exportButtonStyles}>
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
      </div>
      <div className={extraSettingsStyles}>
        <PipelineExtraSettings />
      </div>
    </div>
  );
};

const connector = connect(null, {
  onExportToLanguage: exportToLanguage,
});
type PipelineSettingsProps = ConnectedProps<typeof connector>;
export default connector(PipelineSettings);

import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { Button, Icon, css, spacing } from '@mongodb-js/compass-components';
import { exportToLanguage } from '../../../modules/export-to-language';

import { SaveMenu, CreateMenu } from './pipeline-menus';
import PipelineName from './pipeline-name';
import PipelineExtraSettings from './pipeline-extra-settings';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing[2],
});

const actionStyles = css({
  display: 'flex',
});

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const PipelineSettings: React.FunctionComponent<PipelineSettingsProps> = ({
  onExportToLanguage,
}) => {
  return (
    <div className={containerStyles}>
      <div className={actionStyles}>
        <PipelineName />
        <SaveMenu />
        <CreateMenu />
        <Button
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph={'Export'} />}
          onClick={() => onExportToLanguage()}
        >
          Export to language
        </Button>
      </div>
      <PipelineExtraSettings />
    </div>
  );
};

const connector = connect(null, {
  onExportToLanguage: exportToLanguage,
});
type PipelineSettingsProps = ConnectedProps<typeof connector>;
export default connector(PipelineSettings);

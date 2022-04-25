import React, { useState } from 'react';
import { Toolbar, css, cx, spacing, uiColors } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';

import type { RootState } from '../../modules';

const containerStyles = css({
  paddingTop: spacing[3],
  paddingRight: spacing[5],
  paddingBottom: spacing[3],
  paddingLeft: spacing[3]
});

const containerDisplayStyles = css({
  display: 'grid',
  gap: spacing[4],
  gridTemplateAreas: `
  "headerAndOptionsRow"
  `,
  marginLeft: spacing[1],
  marginRight: spacing[1]
});

const displaySettings = css({
  gridTemplateAreas: `
  "headerAndOptionsRow"
  "settingsRow"
  `
});

const headerAndOptionsRowStyles = css({
  gridArea: 'headerAndOptionsRow',
  border: '1px solid',
  borderRadius: '6px',
  borderColor: uiColors.gray.light2,
  padding: spacing[2]
});

const settingsRowStyles = css({
  gridArea: 'settingsRow'
});

type PipelineToolbarProps = {
  isSettingsVisible: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
};

export const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  isSettingsVisible,
  showRunButton,
  showExportButton
}) => {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  return (
    <Toolbar
      className={cx(
        containerStyles,
        containerDisplayStyles,
        isSettingsVisible && displaySettings
      )}
      data-testid="pipeline-toolbar"
    >
      <>
        <div className={headerAndOptionsRowStyles}>
          <PipelineHeader
            isOptionsVisible={isOptionsVisible}
            onToggleOptions={() => setIsOptionsVisible(!isOptionsVisible)}
            showRunButton={showRunButton}
            showExportButton={showExportButton}
          />
          {isOptionsVisible && <PipelineOptions />}
        </div>
        {isSettingsVisible && (
          <div className={settingsRowStyles}>
            <PipelineSettings />
          </div>
        )}
      </>
    </Toolbar>
  );
};

const mapState = ({ workspace }: RootState) => ({
  isSettingsVisible: workspace === 'builder'
});
export default connect(mapState)(PipelineToolbar);

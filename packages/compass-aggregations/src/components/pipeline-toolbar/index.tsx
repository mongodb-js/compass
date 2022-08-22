import React, { useState } from 'react';
import { Toolbar, css, cx, spacing, uiColors, withTheme } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';

import type { RootState } from '../../modules';

const containerStyles = css({
  padding: spacing[3],
  paddingRight: spacing[5],
});

const containerDisplayStyles = css({
  display: 'grid',
  gap: spacing[3],
  gridTemplateAreas: `
  "headerAndOptionsRow"
  `,
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

const headerAndOptionsRowDarkStyles = css({
  borderColor: uiColors.gray.dark2,
});

const settingsRowStyles = css({
  gridArea: 'settingsRow'
});

const optionsStyles = css({
  marginTop: spacing[2],
});

type PipelineToolbarProps = {
  darkMode?: boolean;
  isSettingsVisible: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
};

export const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  darkMode,
  isSettingsVisible,
  showRunButton,
  showExportButton,
  showExplainButton,
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
        <div
          className={cx(
            headerAndOptionsRowStyles,
            darkMode && headerAndOptionsRowDarkStyles
          )}
        >
          <PipelineHeader
            isOptionsVisible={isOptionsVisible}
            onToggleOptions={() => setIsOptionsVisible(!isOptionsVisible)}
            showRunButton={showRunButton}
            showExportButton={showExportButton}
            showExplainButton={showExplainButton}
          />
          {isOptionsVisible && (
            <div className={optionsStyles}>
              <PipelineOptions />
            </div>
          )}
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
export default withTheme(connect(mapState)(PipelineToolbar));

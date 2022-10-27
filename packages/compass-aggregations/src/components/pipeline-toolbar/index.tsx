import React, { useState } from 'react';
import { css, cx, spacing, palette, withTheme } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';

import type { RootState } from '../../modules';
import PipelineResultsHeader from '../pipeline-results-workspace/pipeline-results-header';

const containerStyles = css({
  padding: spacing[3],
});

const containerDisplayStyles = css({
  display: 'grid',
  gap: spacing[3],
  gridTemplateAreas: `
  "headerAndOptionsRow"
  "settingsRow"
  `,
});


const headerAndOptionsRowStyles = css({
  gridArea: 'headerAndOptionsRow',
  border: '1px solid',
  borderRadius: '6px',
  borderColor: palette.gray.light2,
  padding: `${spacing[2]}px ${spacing[2]}px ${spacing[2]}px ${spacing[3]}px`,
  background: palette.white
});

const headerAndOptionsRowDarkStyles = css({
  borderColor: palette.gray.dark2,
  background: palette.gray.dark3,
});

const settingsRowStyles = css({
  gridArea: 'settingsRow'
});

const optionsStyles = css({
  marginTop: spacing[2],
});

type PipelineToolbarProps = {
  darkMode?: boolean;
  isBuilderView: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
  onChangeAllDocsExpanded: (val: boolean) => void;
};

export const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  darkMode,
  isBuilderView,
  showRunButton,
  showExportButton,
  showExplainButton,
  onChangeAllDocsExpanded,
}) => {
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  return (
    <div
      className={cx(
        containerStyles,
        containerDisplayStyles,
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
        {isBuilderView ? (
          <div className={settingsRowStyles}>
            <PipelineSettings />
          </div>
        ) : <div className={settingsRowStyles}><PipelineResultsHeader onChangeAllDocsExpanded={onChangeAllDocsExpanded}/></div>}
      </>
    </div>
  );
};

const mapState = ({ workspace }: RootState) => ({
  isBuilderView: workspace === 'builder'
});
export default withTheme(connect(mapState)(PipelineToolbar));

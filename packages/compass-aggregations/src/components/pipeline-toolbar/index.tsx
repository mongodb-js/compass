import React, { useState } from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { useIsAIFeatureEnabled } from 'compass-preferences-model/provider';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';
import PipelineAI from './pipeline-ai';

import type { RootState } from '../../modules';
import PipelineResultsHeader from '../pipeline-results-workspace/pipeline-results-header';
import { PipelineToolbarContainer } from './pipeline-toolbar-container';

const headerAndOptionsRowStyles = css({
  gridArea: 'headerAndOptionsRow',
  border: '1px solid',
  borderRadius: '6px',
  borderColor: palette.gray.light2,
  padding: spacing[2],
  background: palette.white,
});

const headerAndOptionsRowDarkStyles = css({
  borderColor: palette.gray.dark2,
  background: palette.black,
});

const settingsRowStyles = css({
  gridArea: 'settingsRow',
});

const optionsStyles = css({
  marginTop: spacing[2],
});

export type PipelineToolbarProps = {
  isAIInputVisible?: boolean;
  isAggregationGeneratedFromQuery?: boolean;
  isBuilderView: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
  onHideAIInputClick?: () => void;
};

export const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  isBuilderView,
  showRunButton,
  showExportButton,
  showExplainButton,
}) => {
  const darkMode = useDarkMode();
  const isAIFeatureEnabled = useIsAIFeatureEnabled();
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  return (
    <PipelineToolbarContainer>
      <div
        className={cx(
          headerAndOptionsRowStyles,
          darkMode && headerAndOptionsRowDarkStyles
        )}
      >
        {isAIFeatureEnabled && isBuilderView && <PipelineAI />}
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
      ) : (
        <div className={settingsRowStyles}>
          <PipelineResultsHeader />
        </div>
      )}
    </PipelineToolbarContainer>
  );
};

const mapState = (state: RootState) => {
  return {
    isBuilderView: state.workspace === 'builder',
  };
};

export default connect(mapState)(PipelineToolbar);

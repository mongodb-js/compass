import React, { useState } from 'react';
import {
  css,
  cx,
  spacing,
  palette,
  useDarkMode,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { usePreference } from 'compass-preferences-model';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';
import { PipelineAI } from './pipeline-ai';
import { hideInput as hideAIInput } from '../../modules/pipeline-builder/pipeline-ai';

import type { RootState } from '../../modules';
import PipelineResultsHeader from '../pipeline-results-workspace/pipeline-results-header';
import type { PipelineOutputOption } from '../pipeline-output-options-menu';

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

type PipelineToolbarProps = {
  isAIInputVisible?: boolean;
  isAIGuideCueVisible?: boolean;
  guideCueTitle?: string;
  guideCueDescription?: string;
  isBuilderView: boolean;
  showRunButton: boolean;
  showExportButton: boolean;
  showExplainButton: boolean;
  onChangePipelineOutputOption: (val: PipelineOutputOption) => void;
  onHideAIInputClick?: () => void;
  pipelineOutputOption: PipelineOutputOption;
};

export const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  isAIInputVisible = false,
  isAIGuideCueVisible = false,
  guideCueTitle,
  guideCueDescription,
  isBuilderView,
  showRunButton,
  showExportButton,
  showExplainButton,
  onChangePipelineOutputOption,
  onHideAIInputClick,
  pipelineOutputOption,
}) => {
  const darkMode = useDarkMode();
  const enableAIExperience = usePreference('enableAIExperience', React);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  return (
    <div
      className={cx(containerStyles, containerDisplayStyles)}
      data-testid="pipeline-toolbar"
    >
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
        {enableAIExperience && (
          <PipelineAI
            onClose={() => {
              onHideAIInputClick?.();
            }}
            show={isAIInputVisible}
            showGuideCue={isAIGuideCueVisible}
            guideCueTitle={guideCueTitle}
            guideCueDescription={guideCueDescription}
          />
        )}
      </div>
      {isBuilderView ? (
        <div className={settingsRowStyles}>
          <PipelineSettings />
        </div>
      ) : (
        <div className={settingsRowStyles}>
          <PipelineResultsHeader
            onChangePipelineOutputOption={onChangePipelineOutputOption}
            pipelineOutputOption={pipelineOutputOption}
          />
        </div>
      )}
    </div>
  );
};

const mapState = (state: RootState) => {
  return {
    isBuilderView: state.workspace === 'builder',
    isAIInputVisible: state.pipelineBuilder.aiPipeline.isInputVisible,
    isAIGuideCueVisible: state.pipelineBuilder.aiPipeline.isGuideCueVisible,
    guideCueTitle: state.pipelineBuilder.aiPipeline.guideCueTitle,
    guideCueDescription: state.pipelineBuilder.aiPipeline.guideCueDescription,
  };
};
export default connect(mapState, {
  onHideAIInputClick: hideAIInput,
})(PipelineToolbar);

import React from 'react';
import { connect } from 'react-redux';
import {
  Icon,
  Toggle,
  Label,
  css,
  IconButton,
  spacing,
  SegmentedControl,
  SegmentedControlOption,
} from '@mongodb-js/compass-components';
import { toggleSettingsIsExpanded } from '../../../modules/settings';
import { toggleAutoPreview } from '../../../modules/auto-preview';
import type { RootState } from '../../../modules';
import { changePipelineMode } from '../../../modules/pipeline-builder/pipeline-mode';
import type { PipelineMode } from '../../../modules/pipeline-builder/pipeline-mode';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';

const containerStyles = css({
  display: 'flex',
  gap: spacing[2],
  justifyItems: 'center',
});

const toggleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[1],
});

const toggleLabelStyles = css({
  marginBottom: 0,
  padding: 0,
  textTransform: 'uppercase',
});

type PipelineExtraSettingsProps = {
  isAutoPreview: boolean;
  isPipelineModeDisabled: boolean;
  pipelineMode: PipelineMode;
  onToggleAutoPreview: (newVal: boolean) => void;
  onChangePipelineMode: (newVal: PipelineMode) => void;
  onToggleSettings: () => void;
};

export const PipelineExtraSettings: React.FunctionComponent<
  PipelineExtraSettingsProps
> = ({
  isAutoPreview,
  isPipelineModeDisabled,
  pipelineMode,
  onToggleAutoPreview,
  onChangePipelineMode,
  onToggleSettings,
}) => {
  return (
    <div
      className={containerStyles}
      data-testid="pipeline-toolbar-extra-settings"
    >
      <div className={toggleStyles}>
        <Toggle
          id="auto-preview"
          size="xsmall"
          aria-label="Toggle Auto Preview"
          onChange={(checked) => {
            onToggleAutoPreview(checked);
          }}
          data-testid="pipeline-toolbar-preview-toggle"
          checked={isAutoPreview}
        />
        <Label className={toggleLabelStyles} htmlFor="auto-preview">
          Preview
        </Label>
      </div>
      <SegmentedControl
        // SegmentedControl is not working correctly otherwise
        // https://jira.mongodb.org/browse/LG-2597
        key={pipelineMode}
        data-testid="pipeline-builder-toggle"
        value={pipelineMode}
        size={'small'}
        onChange={(value) => {
          onChangePipelineMode(value as PipelineMode);
        }}
      >
        <SegmentedControlOption
          disabled={isPipelineModeDisabled}
          data-testid="pipeline-builder-toggle-builder-ui"
          value="builder-ui"
          glyph={<Icon glyph="CurlyBraces"></Icon>}
        >
          Stages
        </SegmentedControlOption>
        <SegmentedControlOption
          disabled={isPipelineModeDisabled}
          data-testid="pipeline-builder-toggle-as-text"
          value="as-text"
          glyph={<Icon glyph="Code"></Icon>}
        >
          Text
        </SegmentedControlOption>
      </SegmentedControl>
      <IconButton
        title="More Settings"
        aria-label="More Settings"
        onClick={() => onToggleSettings()}
        data-testid="pipeline-toolbar-settings-button"
      >
        <Icon glyph="Settings" />
      </IconButton>
    </div>
  );
};

const mapState = (state: RootState) => {
  return {
    isAutoPreview: state.autoPreview,
    isPipelineModeDisabled: getIsPipelineInvalidFromBuilderState(state, false),
    pipelineMode: state.pipelineBuilder.pipelineMode,
  };
};

const mapDispatch = {
  onToggleAutoPreview: toggleAutoPreview,
  onChangePipelineMode: changePipelineMode,
  onToggleSettings: toggleSettingsIsExpanded,
};

export default connect(mapState, mapDispatch)(PipelineExtraSettings);

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
  Button,
} from '@mongodb-js/compass-components';
import { toggleSettingsIsExpanded } from '../../../modules/settings';
import { toggleAutoPreview } from '../../../modules/auto-preview';
import type { RootState } from '../../../modules';
import { changePipelineMode } from '../../../modules/pipeline-builder/pipeline-mode';
import type { PipelineMode } from '../../../modules/pipeline-builder/pipeline-mode';
import { getIsPipelineInvalidFromBuilderState } from '../../../modules/pipeline-builder/builder-helpers';
import { toggleSidePanel } from '../../../modules/side-panel';
import {
  hiddenOnNarrowPipelineToolbarStyles,
  smallPipelineToolbar,
} from '../pipeline-toolbar-container';

const containerStyles = css({
  display: 'flex',
  gap: spacing[200],
  justifyItems: 'center',
});

const toggleStyles = css({
  display: 'flex',
  alignItems: 'center',
  gap: spacing[100],
});

const toggleLabelStyles = css({
  marginBottom: 0,
  padding: 0,
  textTransform: 'uppercase',
});

const segmentControlStyles = css({
  [smallPipelineToolbar()]: {
    // NB: leafygreen renders labels near icons, that's the most "stable" way of
    // targeting it so we can hide it on smaller toolbar sizes. This can still
    // break if they drastically change how segmented control is rendered
    '& [data-segmented-control-icon] + span': {
      display: 'none',
    },
  },
});

const toggleStageWizardStyles = css({ margin: 'auto' });

type PipelineExtraSettingsProps = {
  isAutoPreview?: boolean | undefined;
  isPipelineModeDisabled: boolean;
  pipelineMode: PipelineMode;
  onToggleAutoPreview: (newVal: boolean) => void;
  onChangePipelineMode: (newVal: PipelineMode) => void;
  onToggleSettings: () => void;
  onToggleSidePanel: () => void;
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
  onToggleSidePanel,
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
        size="xsmall"
        data-testid="pipeline-builder-toggle"
        value={pipelineMode}
        onChange={(value) => {
          onChangePipelineMode(value as PipelineMode);
        }}
      >
        <SegmentedControlOption
          disabled={isPipelineModeDisabled}
          data-testid="pipeline-builder-toggle-builder-ui"
          value="builder-ui"
          glyph={<Icon data-segmented-control-icon glyph="CurlyBraces"></Icon>}
          className={segmentControlStyles}
        >
          Stages
        </SegmentedControlOption>
        <SegmentedControlOption
          disabled={isPipelineModeDisabled}
          data-testid="pipeline-builder-toggle-as-text"
          value="as-text"
          glyph={<Icon data-segmented-control-icon glyph="Code"></Icon>}
          className={segmentControlStyles}
        >
          Text
        </SegmentedControlOption>
      </SegmentedControl>
      <Button
        size="xsmall"
        leftGlyph={<Icon glyph="Wizard" />}
        onClick={onToggleSidePanel}
        title="Toggle Stage Wizard"
        aria-label="Toggle Stage Wizard"
        data-testid="pipeline-toolbar-side-panel-button"
        className={toggleStageWizardStyles}
        disabled={pipelineMode === 'as-text'}
      >
        <span className={hiddenOnNarrowPipelineToolbarStyles}>Wizard</span>
      </Button>
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
  onToggleSidePanel: toggleSidePanel,
};

export default connect(mapState, mapDispatch)(PipelineExtraSettings);

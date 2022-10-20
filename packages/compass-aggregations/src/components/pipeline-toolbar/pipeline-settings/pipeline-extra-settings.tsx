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
  pipelineMode: PipelineMode;
  onToggleAutoPreview: (newVal: boolean) => void;
  onChangePipelineMode: (newVal: PipelineMode) => void;
  onToggleSettings: () => void;
};

export const PipelineExtraSettings: React.FunctionComponent<
  PipelineExtraSettingsProps
> = ({
  isAutoPreview,
  pipelineMode,
  onToggleAutoPreview,
  onChangePipelineMode,
  onToggleSettings,
}) => {
  const showPipelineAsText =
    process?.env?.COMPASS_ENABLE_AS_TEXT_PIPELINE === 'true';
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
          Auto Preview
        </Label>
      </div>
      {showPipelineAsText && (
        <SegmentedControl
          data-testid="pipeline-builder-toggle"
          value={pipelineMode}
          size={'small'}
          onChange={(value) => {
            onChangePipelineMode(value as PipelineMode);
          }}
        >
          <SegmentedControlOption value="builder-ui">
            <Icon size="small" glyph="CurlyBraces"></Icon>
            Builder UI
          </SegmentedControlOption>
          <SegmentedControlOption value="as-text">
            <Icon size="small" glyph="Code"></Icon>
            As Text
          </SegmentedControlOption>
        </SegmentedControl>
      )}
      <IconButton
        aria-label="More Settings"
        onClick={() => onToggleSettings()}
        data-testid="pipeline-toolbar-settings-button"
      >
        <Icon glyph="Settings" />
      </IconButton>
    </div>
  );
};

const mapState = ({
  autoPreview,
  pipelineBuilder: { pipelineMode },
}: RootState) => ({
  isAutoPreview: autoPreview,
  pipelineMode,
});

const mapDispatch = {
  onToggleAutoPreview: toggleAutoPreview,
  onChangePipelineMode: changePipelineMode,
  onToggleSettings: toggleSettingsIsExpanded,
};

export default connect(mapState, mapDispatch)(PipelineExtraSettings);

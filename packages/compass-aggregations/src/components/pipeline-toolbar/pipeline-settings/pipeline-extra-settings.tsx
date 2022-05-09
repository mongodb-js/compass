import React from 'react';
import { connect } from 'react-redux';
import {
  Icon,
  Toggle,
  Label,
  css,
  IconButton,
  spacing,
} from '@mongodb-js/compass-components';
import { toggleSettingsIsExpanded } from '../../../modules/settings';
import { toggleAutoPreview } from '../../../modules/auto-preview';
import type { RootState } from '../../../modules';

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
  onToggleAutoPreview: (newVal: boolean) => void;
  onToggleSettings: () => void;
};

export const PipelineExtraSettings: React.FunctionComponent<PipelineExtraSettingsProps> =
  ({ isAutoPreview, onToggleAutoPreview, onToggleSettings }) => {
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
              onToggleAutoPreview(checked)
            }}
            data-testid="pipeline-toolbar-preview-toggle"
            checked={isAutoPreview}
          />
          <Label className={toggleLabelStyles} htmlFor="auto-preview">
            Auto Preview
          </Label>
        </div>

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

const mapState = ({ autoPreview }: RootState) => ({
  isAutoPreview: autoPreview,
});

const mapDispatch = {
  onToggleAutoPreview: toggleAutoPreview,
  onToggleSettings: toggleSettingsIsExpanded,
};

export default connect(mapState, mapDispatch)(PipelineExtraSettings);

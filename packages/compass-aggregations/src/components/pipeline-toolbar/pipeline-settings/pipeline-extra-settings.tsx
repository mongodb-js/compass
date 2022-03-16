import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Icon,
  Toggle,
  Label,
  css,
  spacing,
  IconButton,
} from '@mongodb-js/compass-components';
import { toggleSettingsIsExpanded } from '../../../modules/settings';
import { toggleAutoPreview } from '../../../modules/auto-preview';

const extraSettingsGroupStyles = css({
  display: 'flex',
});

const buttonStyles = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const toggleStyles = css({
  display: 'flex',
  alignItems: 'flex-end',
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const toggleLabelStyles = css({
  marginBottom: 0,
  textTransform: 'uppercase',
  marginLeft: spacing[1],
});

const PipelineExtraSettings: React.FunctionComponent<PipelineExtraSettingsProps> =
  ({ onToggleAutoPreview, onToggleSettings }) => {
    return (
      <div className={extraSettingsGroupStyles}>
        <div className={toggleStyles}>
          <Toggle
            id="auto-preview"
            size="small"
            aria-label="Toggle Auto Preview"
            onChange={() => onToggleAutoPreview()}
          />
          <Label className={toggleLabelStyles} htmlFor="auto-preview">
            Auto Preview
          </Label>
        </div>

        <IconButton
          aria-label="More Settings"
          onClick={() => onToggleSettings()}
          className={buttonStyles}
        >
          <Icon glyph="Settings" />
        </IconButton>
      </div>
    );
  };

const mapDispatch = {
  onToggleAutoPreview: toggleAutoPreview,
  onToggleSettings: toggleSettingsIsExpanded,
};

const connector = connect(null, mapDispatch);
type PipelineExtraSettingsProps = ConnectedProps<typeof connector>;
export default connector(PipelineExtraSettings);

import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Button,
  Icon,
  Toggle,
  Label,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import { toggleSettingsIsExpanded } from '../../modules/settings';
import { toggleAutoPreview } from '../../modules/auto-preview';

const containerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: spacing[2],
});

const buttonGroupStyles = css({
  display: 'flex',
});

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

const PipelineSettings: React.FunctionComponent<PipelineSettingsProps> = ({
  onToggleAutoPreview,
  onToggleSettings,
}) => {
  return (
    <div className={containerStyles}>
      <div className={buttonGroupStyles}>
        <Button
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph="Plus" />}
        >
          New pipeline from text
        </Button>
        <Button
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph="ChevronRight" />}
        >
          Collation
        </Button>
        <Button className={buttonStyles} variant="primaryOutline" size="xsmall">
          Query translator
        </Button>
      </div>
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

        <Button
          onClick={() => onToggleSettings()}
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph="Settings" />}
        ></Button>
      </div>
    </div>
  );
};

const mapState = () => ({});
const mapDispatch = {
  onToggleAutoPreview: toggleAutoPreview,
  onToggleSettings: toggleSettingsIsExpanded,
};

const connector = connect(mapState, mapDispatch);
type PipelineSettingsProps = ConnectedProps<typeof connector>;
export default connector(PipelineSettings);

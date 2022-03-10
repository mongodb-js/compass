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
import { newPipelineFromText } from '../../modules/import-pipeline';
import { collationCollapseToggled } from '../../modules/collation-collapser';
import { exportToLanguage } from '../../modules/export-to-language';
import type { RootState } from '../../modules';

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
  isCollationExpanded,
  onNewPipelineFromText,
  onCollationToggle,
  onToggleAutoPreview,
  onToggleSettings,
  onQueryTranslate,
}) => {
  return (
    <div className={containerStyles}>
      <div className={buttonGroupStyles}>
        <Button
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph="Plus" />}
          onClick={() => onNewPipelineFromText()}
        >
          New pipeline from text
        </Button>
        <Button
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={
            <Icon
              glyph={isCollationExpanded ? 'ChevronDown' : 'ChevronRight'}
            />
          }
          onClick={() => onCollationToggle()}
        >
          Collation
        </Button>
        <Button
          className={buttonStyles}
          variant="primaryOutline"
          size="xsmall"
          onClick={() => onQueryTranslate()}
        >
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

const mapState = ({ isCollationExpanded }: RootState) => ({
  isCollationExpanded,
});
const mapDispatch = {
  onToggleAutoPreview: toggleAutoPreview,
  onToggleSettings: toggleSettingsIsExpanded,
  onNewPipelineFromText: newPipelineFromText,
  onCollationToggle: collationCollapseToggled,
  onQueryTranslate: exportToLanguage,
};

const connector = connect(mapState, mapDispatch);
type PipelineSettingsProps = ConnectedProps<typeof connector>;
export default connector(PipelineSettings);

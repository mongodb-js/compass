import React from 'react';
import { css, cx, spacing, uiColors } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';

import PipelineHeader from './pipeline-header';
import PipelineOptions from './pipeline-options';
import PipelineSettings from './pipeline-settings';

import type { RootState } from '../../modules';

const containerStyles = css({
  paddingTop: spacing[3],
  paddingRight: spacing[5],
  paddingBottom: spacing[3],
  paddingLeft: spacing[3],
});

const containerDisplayStyles = css({
  display: 'grid',
  gap: spacing[4],
  gridTemplateAreas: `
  "headerAndOptionsRow"
  "settingsRow"
  `,
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const headerAndOptionsRowStyles = css({
  gridArea: 'headerAndOptionsRow',
  border: '1px solid',
  borderRadius: '6px',
  borderColor: uiColors.gray.light2,
  padding: spacing[2],
});

const settingsRowStyles = css({
  gridArea: 'settingsRow',
});

const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  isSettingsVisible,
  isOptionsVisible,
}) => {
  return (
    <div
      className={cx(containerStyles, containerDisplayStyles)}
      data-testid="pipeline-toolbar"
    >
      <div className={headerAndOptionsRowStyles}>
        <PipelineHeader />
        {isOptionsVisible && <PipelineOptions />}
      </div>
      {isSettingsVisible && (
        <div className={settingsRowStyles}>
          <PipelineSettings />
        </div>
      )}
    </div>
  );
};

const mapState = ({ workspace, isOptionsVisible }: RootState) => ({
  isSettingsVisible: workspace === 'builder',
  isOptionsVisible,
});
const connector = connect(mapState);
type PipelineToolbarProps = ConnectedProps<typeof connector>;
export default connector(PipelineToolbar);

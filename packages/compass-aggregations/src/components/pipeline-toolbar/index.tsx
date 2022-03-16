import React from 'react';
import { css, spacing, uiColors } from '@mongodb-js/compass-components';
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

const headerAndOptionsRowStyles = css({
  border: '1px solid',
  borderRadius: '6px',
  borderColor: uiColors.gray.light2,
  padding: spacing[2],
  marginRight: spacing[1],
  marginLeft: spacing[1],
  paddingBottom: spacing[2],
});

const settingsRowStyles = css({
  marginRight: spacing[1],
  marginLeft: spacing[1],
  paddingTop: spacing[2],
});

const PipelineToolbar: React.FunctionComponent<PipelineToolbarProps> = ({
  isSettingsVisible,
  isOptionsVisible,
}) => {
  return (
    <div className={containerStyles}>
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

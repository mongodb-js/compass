import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Overline,
  Description,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';

const pipelineTitleContainerStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'baseline',
  justifyContent: 'start',
  marginLeft: spacing[1],
});

const pipelineNameStyles = css({
  marginRight: spacing[2],
});

const pipelineChangedStateStyles = css({
  margin: 0,
});

const PipelineTitle: React.FunctionComponent<PipelineTitleProps> = ({
  name,
  isModified,
}) => {
  return (
    <div className={pipelineTitleContainerStyles}>
      <Overline className={pipelineNameStyles}>Pipeline overview</Overline>
      <Description className={pipelineChangedStateStyles}>
        {name}
        {isModified ? ' (modified)' : ''}
      </Description>
    </div>
  );
};

const mapState = (state: RootState) => ({
  name: state.name || 'Untitled',
  isModified: state.isModified,
});
const connector = connect(mapState);
type PipelineTitleProps = ConnectedProps<typeof connector>;
export default connector(PipelineTitle);

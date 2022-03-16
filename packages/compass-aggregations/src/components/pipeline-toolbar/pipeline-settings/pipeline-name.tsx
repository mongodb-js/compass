import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { css, spacing, Body, Tooltip } from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';

const pipelineNameStyles = css({
  display: 'flex',
  alignItems: 'center',
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const nameStyles = css({
  maxWidth: '100px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
});

const modifiedStyles = css({
  fontStyle: 'italic',
});

const PipelineName: React.FunctionComponent<PipelineNameProps> = ({
  name,
  isModified,
}) => {
  return (
    <Body className={pipelineNameStyles}>
      {name === '' ? (
        'Untitled'
      ) : (
        <Tooltip
          align="top"
          justify="start"
          trigger={() => <div className={nameStyles}>{name}</div>}
        >
          {name}
        </Tooltip>
      )}
      &nbsp;
      <span className={modifiedStyles}>{isModified ? '- modified' : ''}</span>
    </Body>
  );
};

const mapState = ({ name, isModified }: RootState) => ({
  name,
  isModified,
});

const connector = connect(mapState);
type PipelineNameProps = ConnectedProps<typeof connector>;
export default connector(PipelineName);

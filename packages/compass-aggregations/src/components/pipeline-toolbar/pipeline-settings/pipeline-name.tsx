import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import { css, Body, Tooltip } from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';

const pipelineNameStyles = css({
  display: 'flex',
  alignItems: 'center',
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
          trigger={({ children, ...props }) => (
            <span {...props} className={nameStyles}>
              {children}
              {name}
            </span>
          )}
        >
          <Body>{name}</Body>
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

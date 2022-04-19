import React from 'react';
import { connect } from 'react-redux';
import { css, Body, Tooltip } from '@mongodb-js/compass-components';
import type { RootState } from '../../../modules';

const containerStyles = css({
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
  whiteSpace: 'nowrap',
});

type PipelineNameProps = {
  name: string;
  isModified: boolean;
};

export const PipelineName: React.FunctionComponent<PipelineNameProps> = ({
  name,
  isModified,
}) => {
  return (
    <Body className={containerStyles} data-testid="pipeline-name">
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
      {isModified && <span className={modifiedStyles}>&nbsp;– modified</span>}
    </Body>
  );
};

const mapState = ({ name, isModified }: RootState) => ({
  name,
  isModified,
});

export default connect(mapState)(PipelineName);

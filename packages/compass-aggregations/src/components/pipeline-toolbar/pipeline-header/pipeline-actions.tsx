import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Button,
  css,
  cx,
  spacing,
  Link,
  Icon,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../../modules';
import { runAggregation } from '../../../modules/aggregation';
import { changeWorkspace } from '../../../modules/workspace';
import { toggleOptions } from '../../../modules/options';

const containerStyles = css({
  display: 'flex',
});

const defaultMargins = css({
  marginLeft: spacing[1],
  marginRight: spacing[1],
});

const optionsButtonStyles = css({
  backgroundColor: 'transparent',
  border: 'none',
});

const optionStyles = css({
  display: 'flex',
  alignItems: 'center',
});

const PipelineActions: React.FunctionComponent<PipelineActionsProps> = ({
  isOptionsVisible,
  onRunAggregation,
  onChangeWorkspace,
  onToggleOptions,
}) => {
  const optionsIcon = isOptionsVisible ? 'CaretDown' : 'CaretRight';
  return (
    <div className={containerStyles}>
      <Button
        data-testid="pipeline-toolbar-run-button"
        className={defaultMargins}
        variant="primary"
        size="small"
        onClick={() => {
          // todo: fix dispatch
          onChangeWorkspace('results');
          onRunAggregation();
        }}
      >
        Run
      </Button>
      <Link
        as="button"
        className={optionsButtonStyles}
        data-testid="pipeline-toolbar-options-button"
        hideExternalIcon={true}
        onClick={() => onToggleOptions()}
      >
        <div className={cx(defaultMargins, optionStyles)}>
          {isOptionsVisible ? 'Less' : 'More'} Options{' '}
          <Icon glyph={optionsIcon} />
        </div>
      </Link>
    </div>
  );
};

const mapState = ({ isOptionsVisible }: RootState) => ({
  isOptionsVisible,
});

const mapDispatch = {
  onChangeWorkspace: changeWorkspace,
  onRunAggregation: runAggregation,
  onToggleOptions: toggleOptions,
};

const connector = connect(mapState, mapDispatch);
type PipelineActionsProps = ConnectedProps<typeof connector>;
export default connector(PipelineActions);

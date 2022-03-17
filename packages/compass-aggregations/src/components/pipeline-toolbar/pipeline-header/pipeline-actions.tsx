import React from 'react';
import { connect } from 'react-redux';
import type { ConnectedProps } from 'react-redux';
import {
  Button,
  css,
  spacing,
  Link,
  Icon,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../../modules';
import { runAggregation } from '../../../modules/aggregation';
import { changeWorkspace } from '../../../modules/workspace';
import { toggleOptions } from '../../../modules/options';

const containerStyles = css({
  display: 'grid',
  gap: spacing[2],
  gridTemplateAreas: '"run options"',
});

const runButtonStyles = css({
  gridArea: 'run',
});

const optionsButtonStyles = css({
  gridArea: 'options',
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline',
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
        className={runButtonStyles}
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
        <div className={optionStyles}>
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

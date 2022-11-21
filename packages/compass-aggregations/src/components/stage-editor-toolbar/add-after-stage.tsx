import React, { useCallback } from 'react';
import { Tooltip, css, cx } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import { addStage } from '../../modules/pipeline-builder/stage-editor';

const addAfterStageButtonStyles = css({
  // TODO(COMPASS-6234): We'll remove these hardcoded values.
  width: '30px',
  marginRight: '6px',
})

type AddAfterStageProps = {
  index: number;
  onAddStageClick: (index: number) => void;
};

/**
 * The add after stage button.
 */
export function AddAfterStage({
  index,
  onAddStageClick
}: AddAfterStageProps) {
  /**
   * Handle stage add after clicks.
   */
  const onStageAddedAfter = useCallback(() => {
    onAddStageClick(index);
  }, [ onAddStageClick, index ]);
  
  return (
    <Tooltip
      trigger={({ children, ...props }) => (
        <div {...props}>
          <button
            data-testid="add-after-stage"
            type="button"
            className={cx('btn btn-default btn-xs', addAfterStageButtonStyles)}
            onClick={onStageAddedAfter}
          >
            +
          </button>
          {children}
        </div>
      )}
    >
      Add stage below
    </Tooltip>
  );
}

export default connect(null, { onAddStageClick: addStage })(AddAfterStage);

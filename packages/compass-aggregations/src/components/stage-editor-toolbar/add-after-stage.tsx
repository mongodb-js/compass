import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import { IconButton, Icon, Tooltip } from '@mongodb-js/compass-components';

import { addStage } from '../../modules/pipeline-builder/stage-editor';


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
          <IconButton
            data-testid="add-after-stage"
            onClick={onStageAddedAfter}
            aria-label="Add stage below"
          ><Icon glyph="Plus" size="small" /></IconButton>
          {children}
        </div>
      )}
    >
      Add stage below
    </Tooltip>
  );
}

export default connect(null, { onAddStageClick: addStage })(AddAfterStage);

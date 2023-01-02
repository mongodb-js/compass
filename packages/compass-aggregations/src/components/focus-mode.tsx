import React from 'react';
import {
  InfoModal,
  Body,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../modules';
import { focusModeDisabled } from '../modules/focus-mode';


type FocusModeProps = {
  isModalOpen: boolean;
  stageIndex: number;
  stage: any;
  onCloseModal: () => void;
};

export const FocusMode: React.FunctionComponent<FocusModeProps> = ({
  isModalOpen,
  stageIndex,
  stage,
  onCloseModal,
}) => {
  if (!isModalOpen) return null;
  return (
    <InfoModal
      showCloseButton={false}
      title="Focus Mode"
      size={'large'}
      onClose={onCloseModal}
      open={isModalOpen}
      data-testid={`focus-mode-modal-${stageIndex}`}
      closeIconColor='red'
    >
      <Body>In progress feature.</Body>
      <Body>Focus mode for stage {stage.stageOperator}.</Body>
    </InfoModal>
  );
};

const mapState = ({
  focusMode: { isEnabled, stageIndex },
  pipelineBuilder: {
    stageEditor: {
      stages,
    }
  }
}: RootState) => {
  const stage = stages[stageIndex];
  return {
    isModalOpen: isEnabled,
    stageIndex,
    stage,
  };
};

const mapDispatch = {
  onCloseModal: focusModeDisabled
};
export default connect(mapState, mapDispatch)(FocusMode);

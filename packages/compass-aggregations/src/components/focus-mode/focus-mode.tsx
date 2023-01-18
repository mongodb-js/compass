import React from 'react';
import {
  Modal,
  Body,
  css,
  spacing,
  palette,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import { focusModeDisabled } from '../../modules/focus-mode';
import FocusModeStageEditor from './focus-mode-stage-editor';
import { FocusModeStageInput, FocusModeStageOutput } from './focus-mode-stage-preview';

// These styles make the modal occupy the whole screen,
// with 18px of padding - because that's the
// default padding for the modal (left and right).
const modalStyles = css({
  '> div': {
    height: '100%',
    padding: '18px',
  },
  '[role="dialog"]': {
    width: '100%',
    height: '100%',
    // LG sets maxHeight to calc(100% - 64px). This enables modal
    // to occupy the whole screen.
    maxHeight: '100%', 
    '> div': {
      height: '100%',
    }
  },
});

const containerStyles = css({
  display: 'grid',
  gridTemplateRows: 'min-content 1fr',
  gridTemplateColumns: '1fr',
  overflow: 'hidden',
  padding: spacing[5],
  paddingBottom: 0,
  height: '100%',
});

const headerStyles = css({
  borderBottom: `1px solid ${palette.gray.light2}`,
});

const bodyStyles = css({
  display: 'flex',
  gap: spacing[2],
  height: '100%',
  overflow: 'hidden',
});

const previewAreaStyles = css({
  width: '25%',
  paddingTop: spacing[4],
});

const editorAreaStyles = css({
  width: '50%',
  paddingTop: spacing[4],
  backgroundColor: palette.gray.light3,
});

type FocusModeProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
};

export const FocusMode: React.FunctionComponent<FocusModeProps> = ({
  isModalOpen,
  onCloseModal,
}) => {
  return (
    <Modal
      className={modalStyles}
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid={"focus-mode-modal"}
    >
      <div className={containerStyles}>
        <div className={headerStyles}>
          <Body>Focus Mode (in progress feature)</Body>
        </div>
        <div className={bodyStyles}>
          <div className={previewAreaStyles} data-testid="stage-input">
            <FocusModeStageInput />
          </div>
          <div className={editorAreaStyles} data-testid="stage-editor">
            <FocusModeStageEditor />
          </div>
          <div className={previewAreaStyles} data-testid="stage-output">
            <FocusModeStageOutput />
          </div>
        </div>
      </div>
    </Modal>
  );
};

const mapState = ({
  focusMode: { isEnabled },
}: RootState) => ({
  isModalOpen: isEnabled,
});

const mapDispatch = {
  onCloseModal: focusModeDisabled
};
export default connect(mapState, mapDispatch)(FocusMode);

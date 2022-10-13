import React, { useEffect, useState } from 'react';
import {
  css,
  spacing,
  Modal,
  CancelLoader,
  ModalHeader,
  ModalContent,
  ErrorSummary,
  breakpoints,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import type { ExplainData } from '../../modules/explain';
import { closeExplainModal, cancelExplain } from '../../modules/explain';
import { ExplainResults } from './explain-results';

type PipelineExplainProps = {
  isModalOpen: boolean;
  isLoading: boolean;
  error?: string;
  explain?: ExplainData;
  onCloseModal: () => void;
  onCancelExplain: () => void;
};

const loadingStyles = css({
  display: 'flex',
  justifyContent: 'center',
  height: '100%',
});

const getModalSize = (): 'default' | 'large' => {
  return window.innerWidth <= breakpoints.XLDesktop ? 'default' : 'large';
};

export const PipelineExplain: React.FunctionComponent<PipelineExplainProps> = ({
  isModalOpen,
  isLoading,
  error,
  explain,
  onCloseModal,
  onCancelExplain,
}) => {
  const [modalSize, setModalSize] = useState(getModalSize());
  useEffect(() => {
    if (!isModalOpen) {
      return;
    }
    const resizeListener = () => {
      setModalSize(getModalSize());
    };
    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
  }, [isModalOpen]);

  // The resize listener is only added when the modal is open.
  // As the modal closes, the state persists the last value.
  // If the user changes window size while the modal is closed,
  // upon next open it uses the last known value. So we reset it here.
  useEffect(() => {
    setModalSize(getModalSize());
  }, [isModalOpen]);

  let content = null;
  if (isLoading) {
    content = (
      <div className={loadingStyles}>
        <CancelLoader
          data-testid="pipeline-explain-cancel"
          cancelText="Cancel"
          onCancel={() => onCancelExplain()}
          progressText="Running explain"
        />
      </div>
    );
  } else if (error) {
    content = (
      <ErrorSummary data-testid="pipeline-explain-error" errors={error} />
    );
  } else if (explain) {
    content = <ExplainResults plan={explain.plan} stats={explain.stats} />;
  }

  if (!content) {
    return null;
  }

  return (
    <Modal
      size={modalSize}
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid="pipeline-explain-modal"
      contentVariant="without-footer"
    >
      <ModalHeader title="Explain Plan" />
      <ModalContent>
      {content}
      </ModalContent>
    </Modal>
  );
};

const mapState = ({
  explain: { isModalOpen, isLoading, error, explain },
}: RootState) => ({
  isModalOpen,
  isLoading,
  error,
  explain,
});

const mapDispatch = {
  onCloseModal: closeExplainModal,
  onCancelExplain: cancelExplain,
};
export default connect(mapState, mapDispatch)(PipelineExplain);

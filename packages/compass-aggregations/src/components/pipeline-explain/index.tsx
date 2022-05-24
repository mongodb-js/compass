import React, { useEffect, useState } from 'react';
import {
  css,
  cx,
  spacing,
  Modal,
  CancelLoader,
  H3,
  ModalFooter,
  Button,
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

const modalStyles = css({
  display: 'grid',
  gap: spacing[3],
  gridTemplateRows: 'auto 1fr auto',
});

const headerStyles = css({
  gridArea: 'header',
});

const contentStyles = css({
  gridArea: 'content',
});

const footerStyles = css({
  gridArea: 'footer',
  paddingRight: 0,
  paddingBottom: 0,
});

const loadingStyles = css({
  display: 'flex',
  justifyContent: 'center',
  height: '100%',
});

export const PipelineExplain: React.FunctionComponent<PipelineExplainProps> = ({
  isModalOpen,
  isLoading,
  error,
  explain,
  onCloseModal,
  onCancelExplain,
}) => {
  const [modalSize, setModalSize] = useState<'large' | 'default'>('default');
  useEffect(() => {
    const resizeListener = () => {
      if (window.innerWidth <= breakpoints.XLDesktop) {
        setModalSize('default');
      } else {
        setModalSize('large');
      }
    };
    window.addEventListener('resize', resizeListener);
    return () => {
      window.removeEventListener('resize', resizeListener);
    };
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

  const gridAreaStyles = css({
    gridTemplateAreas: `
      'header'
      'content'
      ${!isLoading ? '"footer"' : ''}
    `,
  });

  return (
    <Modal
      size={modalSize}
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid="pipeline-explain-modal"
      contentClassName={cx(gridAreaStyles, modalStyles)}
    >
      <H3 className={headerStyles}>Explain</H3>
      <div className={contentStyles}>{content}</div>
      {!isLoading && (
        <ModalFooter className={footerStyles}>
          <Button
            onClick={onCloseModal}
            data-testid="pipeline-explain-footer-close-button"
          >
            Close
          </Button>
        </ModalFooter>
      )}
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

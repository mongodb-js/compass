import React from 'react';
import { Modal, H3 } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';

import type { RootState } from '../../modules';
import { closeExplainModal } from '../../modules/explain';

type PipelineExplainProps = {
  isModalOpen: boolean;
  onCloseModal: () => void;
};

export const PipelineExplain: React.FunctionComponent<PipelineExplainProps> = ({
  isModalOpen,
  onCloseModal,
}) => {
  return (
    <Modal
      setOpen={onCloseModal}
      open={isModalOpen}
      data-testid="pipeline-explain-modal"
    >
      <H3>Explain</H3>
    </Modal>
  );
};

const mapState = ({ explain: { isModalOpen } }: RootState) => ({
  isModalOpen: isModalOpen,
});

const mapDispatch = {
  onCloseModal: closeExplainModal,
};
export default connect(mapState, mapDispatch)(PipelineExplain);

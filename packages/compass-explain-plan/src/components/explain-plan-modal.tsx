import { connect } from 'react-redux';
import React from 'react';
import {
  Button,
  SpinLoaderWithLabel,
  Modal,
  ModalFooter,
  ModalHeader,
  spacing,
  css,
  Link,
} from '@mongodb-js/compass-components';
import type { ExplainPlanModalState } from '../stores/explain-plan-modal-store';
import { closeExplainPlanModal } from '../stores/explain-plan-modal-store';
import { ExplainPlanView } from './explain-plan-view';
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

export type ExplainPlanModalProps = Partial<
  Pick<
    ExplainPlanModalState,
    'isModalOpen' | 'status' | 'explainPlan' | 'rawExplainPlan' | 'error'
  >
> &
  Pick<CollectionTabPluginMetadata, 'namespace' | 'isDataLake'> & {
    onModalClose(): void;
  };

const explainPlanModalContentStyles = css({
  '& > div': {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridTemplateRows: 'auto 1fr auto',
  },
});

const explainPlanModalLoadingStyles = css({
  flex: 1,
  minHeight: spacing[1600] * 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const explainPlanModalBodyStyles = css({
  paddingTop: spacing[400],
  paddingLeft: spacing[800],
  paddingRight: spacing[800],
  overflow: 'hidden',
});

const loaderContainerStyles = css({
  height: '100%',
  display: 'flex',
});

const Loader: React.FunctionComponent = () => {
  return (
    <div
      className={explainPlanModalLoadingStyles}
      data-testid="explain-plan-loading"
    >
      <SpinLoaderWithLabel progressText="Running explain"></SpinLoaderWithLabel>
    </div>
  );
};

export const ExplainPlanModal: React.FunctionComponent<
  ExplainPlanModalProps
> = ({
  isModalOpen = false,
  status = 'initial',
  explainPlan,
  rawExplainPlan,
  error,
  onModalClose,
}) => {
  return (
    <Modal
      data-testid="explain-plan-modal"
      contentClassName={explainPlanModalContentStyles}
      open={isModalOpen}
      setOpen={onModalClose}
      fullScreen={true}
    >
      <ModalHeader
        title="Explain Plan"
        subtitle={
          <>
            Explain provides key execution metrics that help diagnose slow
            queries and optimize index usage.&nbsp;
            <Link
              href="https://www.mongodb.com/docs/upcoming/reference/explain-results/#mongodb-data-explain.executionStats"
              target="_blank"
            >
              Learn more
            </Link>
          </>
        }
      ></ModalHeader>

      <div className={explainPlanModalBodyStyles}>
        {status === 'loading' && (
          <div className={loaderContainerStyles}>
            <Loader></Loader>
          </div>
        )}

        {(status === 'ready' || status === 'error') && (
          <ExplainPlanView
            explainPlan={explainPlan}
            rawExplainPlan={rawExplainPlan}
            error={error}
          ></ExplainPlanView>
        )}
      </div>

      <ModalFooter>
        <Button onClick={onModalClose} data-testid="explain-close-button">
          {status === 'loading' ? 'Cancel' : 'Close'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

const ConnectedExplainPlanModal = connect(
  (state: ExplainPlanModalState) => {
    return {
      isModalOpen: state.isModalOpen,
      status: state.status,
      explainPlan: state.explainPlan,
      rawExplainPlan: state.rawExplainPlan,
      error: state.error,
    };
  },
  {
    onModalClose: closeExplainPlanModal,
  }
)(ExplainPlanModal);

export default ConnectedExplainPlanModal;

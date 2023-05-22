import React, { useMemo } from 'react';
import {
  Button,
  CancelLoader,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  spacing,
} from '@mongodb-js/compass-components';
import {
  CodemirrorMultilineEditor,
  prettify,
} from '@mongodb-js/compass-editor';
import { connect } from 'react-redux';
import type { ExplainPlanModalState } from '../stores/explain-plan-modal-store';
import { closeExplainPlanModal } from '../stores/explain-plan-modal-store';
import { KeylineCard } from '@mongodb-js/compass-components';
import ExplainSummary from './explain-summary';
import { Banner } from '@mongodb-js/compass-components';
import { css } from '@mongodb-js/compass-components';

type ExplainPlanModalProps = Pick<
  ExplainPlanModalState,
  'isModalOpen' | 'status' | 'explainPlan' | 'rawExplainPlan' | 'error'
> & { onModalClose(): void };

const explainPlanModalContentStyles = css({
  width: '700px',
});

const explainPlanModalLoadingStyles = css({
  flex: 1,
  minHeight: spacing[6] * 2,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

const explainPlanModalBodyStyles = css({
  display: 'flex',
  overflow: 'hidden',
});

const explainPlanModalViewStyles = css({
  flex: '1 1 0%',
  minHeight: '0%',
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[4],
});

const editorContainerStyles = css({
  flex: '1 1 0%',
  minHeight: '0%',
  overflow: 'hidden',
});

const editorStyles = css({
  '& .cm-editor': {
    paddingLeft: spacing[2],
  },
});

const Loader: React.FunctionComponent = () => {
  return (
    <div className={explainPlanModalLoadingStyles}>
      <CancelLoader progressText="Running explain"></CancelLoader>
    </div>
  );
};

export const ExplainPlanBody: React.FunctionComponent<
  Pick<ExplainPlanModalProps, 'explainPlan' | 'rawExplainPlan' | 'error'>
> = ({ explainPlan, rawExplainPlan, error }) => {
  const rawExplainPlanText = useMemo(() => {
    return rawExplainPlan
      ? prettify(JSON.stringify(rawExplainPlan), 'json')
      : '';
  }, [rawExplainPlan]);

  const explainPlanIndexFields = useMemo(() => {
    return {
      fields:
        explainPlan?.usedIndexes.flatMap((index) => {
          return Object.entries(index.fields).map(([field, value]) => {
            return { field, value };
          });
        }) ?? [],
    };
  }, [explainPlan]);

  return (
    <div className={explainPlanModalViewStyles}>
      {error && <Banner variant="danger">{error}</Banner>}
      {!error && (
        <ExplainSummary
          nReturned={explainPlan?.nReturned ?? 0}
          totalKeysExamined={explainPlan?.totalKeysExamined ?? 0}
          totalDocsExamined={explainPlan?.totalDocsExamined ?? 0}
          executionTimeMillis={explainPlan?.executionTimeMillis ?? 0}
          inMemorySort={explainPlan?.inMemorySort ?? false}
          indexType={explainPlan?.indexType ?? 'UNAVAILABLE'}
          index={explainPlanIndexFields}
        ></ExplainSummary>
      )}
      <KeylineCard className={editorContainerStyles}>
        <CodemirrorMultilineEditor
          language="json"
          text={rawExplainPlanText}
          readOnly={true}
          showAnnotationsGutter={false}
          showLineNumbers={false}
          formattable={false}
          initialJSONFoldAll={false}
          editorClassName={editorStyles}
        ></CodemirrorMultilineEditor>
      </KeylineCard>
    </div>
  );
};

const ExplainPlanModal: React.FunctionComponent<ExplainPlanModalProps> = ({
  isModalOpen,
  status,
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
    >
      <ModalHeader title="Explain Plan"></ModalHeader>

      <ModalBody className={explainPlanModalBodyStyles}>
        {status === 'loading' && <Loader></Loader>}

        {(status === 'ready' || status === 'error') && (
          <ExplainPlanBody
            explainPlan={explainPlan}
            rawExplainPlan={rawExplainPlan}
            error={error}
          ></ExplainPlanBody>
        )}
      </ModalBody>

      <ModalFooter>
        <Button onClick={onModalClose}>
          {status === 'loading' ? 'Cancel' : 'Close'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export const ConnectedExplainPlanModal = connect(
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

export { ConnectedExplainPlanModal as ExplainPlanModal };

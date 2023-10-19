import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  TextInput,
  KeylineCard,
  css,
  spacing,
} from '@mongodb-js/compass-components';
import ReadonlyDocument from './readonly-document';

const modalFooterSpacingStyles = css({
  gap: spacing[2],
});

const documentHorizontalWrapper = css({
  display: 'flex',
  flexDirection: 'row',
  flex: 'none',
  flexShrink: 0,
  overflow: 'auto',
  marginBottom: spacing[2],
  gap: spacing[2],
  maxWidth: '100%',
});

const documentContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  flexShrink: 0,
  marginBottom: spacing[2],
  width: '100%',
});

const documentStyles = css({
  flexBasis: '164px',
  flexGrow: 1,
  flexShrink: 0,
  overflow: 'auto',
  padding: 0,
  width: '100%',
});

type BulkDeleteModalProps = {
  open: boolean;
  documentCount: number;
  filterQuery: string;
  namespace: string;
  sampleDocuments: Document[];
  onCancel: () => void;
  onConfirmDeletion: () => void;
};

const BulkDeleteModal: React.FunctionComponent<BulkDeleteModalProps> = ({
  open,
  documentCount,
  filterQuery,
  namespace,
  sampleDocuments,
  onCancel,
  onConfirmDeletion,
}) => {
  const preview = (
    <div className={documentHorizontalWrapper}>
      {sampleDocuments.map((doc, i) => {
        return (
          <KeylineCard key={i} className={documentContainerStyles}>
            <div className={documentStyles}>
              <ReadonlyDocument doc={doc} />
            </div>
          </KeylineCard>
        );
      })}
    </div>
  );

  return (
    <Modal setOpen={onCancel} open={open}>
      <ModalHeader
        title={`Preview documents to delete (${documentCount})`}
        subtitle={namespace}
        variant={'danger'}
      />
      <ModalBody variant={'danger'}>
        <TextInput label="Query" disabled={true} value={filterQuery} />
        <b>Preview (sample of {sampleDocuments.length} documents)</b>
        {preview}
      </ModalBody>
      <ModalFooter className={modalFooterSpacingStyles}>
        <Button variant="danger" onClick={onConfirmDeletion}>
          Delete documents ({documentCount})
        </Button>
        <Button variant="default" onClick={onCancel}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BulkDeleteModal;

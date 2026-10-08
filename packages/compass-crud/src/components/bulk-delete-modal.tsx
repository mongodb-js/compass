import React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  KeylineCard,
  css,
  cx,
  spacing,
  useId,
  useTranslation,
} from '@mongodb-js/compass-components';
import type { BSONObject } from '../stores/crud-store';
import { toJSString } from 'mongodb-query-parser';
import { ReadonlyFilter } from './readonly-filter';
import ReadonlyDocument from './readonly-document';
import type { Document } from 'bson';

const footerStyles = css({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: spacing[2],
});

const documentListWrapper = css({
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  flexShrink: 0,
  overflow: 'auto',
  marginBottom: spacing[200],
  gap: spacing[200],
  maxHeight: '340px',
});

const documentContainerStyles = css({
  display: 'flex',
  flexShrink: 0,
  marginBottom: spacing[200],
});

const modalBodySpacingStyles = css({
  marginTop: spacing[400] - spacing[100], // see queryBarStyles below
  paddingLeft: spacing[800],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const queryBarStyles = css({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  gap: spacing[400],
  marginTop: spacing[100], // don't cut off the focus/hover ring on the Export button
});

const exportToLanguageButtonStyles = css({
  alignSelf: 'end',
});

type BulkDeleteModalProps = {
  open: boolean;
  documentCount?: number;
  filter: BSONObject;
  namespace: string;
  sampleDocuments: Document[];
  onCancel: () => void;
  onConfirmDeletion: () => void;
  onExportToLanguage: () => void;
};

const BulkDeleteModal: React.FunctionComponent<BulkDeleteModalProps> = ({
  open,
  documentCount,
  filter,
  namespace,
  sampleDocuments,
  onCancel,
  onConfirmDeletion,
  onExportToLanguage,
}) => {
  const t = useTranslation();
  const preview = (
    <div className={documentListWrapper}>
      {sampleDocuments.map((doc, i) => {
        return (
          <KeylineCard key={i} className={cx(documentContainerStyles)}>
            <ReadonlyDocument doc={doc as any} />
          </KeylineCard>
        );
      })}
    </div>
  );

  const exportButtonId = useId();
  return (
    <Modal
      setOpen={onCancel}
      open={open}
      data-testid="bulk-delete-modal"
      initialFocus={`#${exportButtonId}`}
    >
      <ModalHeader
        title={
          documentCount === 1
            ? t('crud.bulkDelete.titleOne', 'Delete {count} document', {
                count: documentCount,
              })
            : t('crud.bulkDelete.titleMany', 'Delete {count} documents', {
                count: documentCount ?? '',
              })
        }
        subtitle={namespace}
        variant={'danger'}
      />
      <ModalBody variant={'danger'} className={modalBodySpacingStyles}>
        <div className={queryBarStyles}>
          <ReadonlyFilter filterQuery={toJSString(filter) ?? ''} />
          <Button
            className={exportToLanguageButtonStyles}
            variant="primaryOutline"
            size="default"
            leftGlyph={<Icon glyph="Code" />}
            onClick={onExportToLanguage}
            data-testid="export-button"
            id={exportButtonId}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          >
            {t('crud.bulkDelete.export', 'Export')}
          </Button>
        </div>

        <div>
          <b data-testid="preview-title">
            {sampleDocuments.length === 1
              ? t(
                  'crud.bulkDelete.previewOne',
                  'Preview (sample of {count} document)',
                  { count: sampleDocuments.length }
                )
              : t(
                  'crud.bulkDelete.previewMany',
                  'Preview (sample of {count} documents)',
                  { count: sampleDocuments.length }
                )}
          </b>
          {preview}
        </div>
      </ModalBody>
      <ModalFooter className={footerStyles}>
        <Button
          variant="default"
          onClick={onCancel}
          data-testid="cancel-button"
        >
          {t('crud.bulkDelete.cancel', 'Cancel')}
        </Button>
        <Button
          variant="danger"
          onClick={onConfirmDeletion}
          data-testid="delete-button"
        >
          {documentCount === 1
            ? t('crud.bulkDelete.deleteOne', 'Delete {count} document', {
                count: documentCount,
              })
            : t('crud.bulkDelete.deleteMany', 'Delete {count} documents', {
                count: documentCount ?? '',
              })}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BulkDeleteModal;

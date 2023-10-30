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
  cx,
  spacing,
  InfoSprinkle,
  Label,
  Icon,
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

const modalBodySpacingStyles = css({
  marginTop: spacing[3],
  paddingLeft: spacing[5],
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[3],
});

const previewStyles = css({
  minHeight: '200px',
});

type QueryLabelProps = {
  tooltip: string;
  label: string;
};

const queryLabelStyles = css({
  display: 'flex',
  gap: spacing[2],
  alignItems: 'center',
});

const QueryLabel: React.FunctionComponent<QueryLabelProps> = ({
  tooltip,
  label,
}) => {
  return (
    <div className={queryLabelStyles}>
      <Label htmlFor="template-dropdown">{label}</Label>
      <InfoSprinkle align="right">{tooltip}</InfoSprinkle>
    </div>
  );
};

type BulkDeleteModalProps = {
  open: boolean;
  documentCount: number;
  filterQuery: string;
  namespace: string;
  sampleDocuments: Document[];
  onCancel: () => void;
  onConfirmDeletion: () => void;
  onExportToLanguage: () => void;
};

const BulkDeleteModal: React.FunctionComponent<BulkDeleteModalProps> = ({
  open,
  documentCount,
  filterQuery,
  namespace,
  sampleDocuments,
  onCancel,
  onConfirmDeletion,
  onExportToLanguage,
}) => {
  const preview = (
    <div className={documentHorizontalWrapper}>
      {sampleDocuments.map((doc, i) => {
        return (
          <KeylineCard
            key={i}
            className={cx(documentContainerStyles, previewStyles)}
          >
            <div className={documentStyles}>
              <ReadonlyDocument doc={doc as any} expandAll={false} />
            </div>
          </KeylineCard>
        );
      })}
    </div>
  );

  return (
    <Modal setOpen={onCancel} open={open}>
      <ModalHeader
        title={`Delete ${documentCount} documents`}
        subtitle={namespace}
        variant={'danger'}
      />
      <ModalBody variant={'danger'} className={modalBodySpacingStyles}>
        <TextInput
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore the label can be any component, but it's weirdly typed to string
          label={
            <QueryLabel
              label="Query"
              tooltip="Return to the Documents tab to edit this query."
            />
          }
          disabled={true}
          value={filterQuery}
        />
        <Button
          variant="primaryOutline"
          size="xsmall"
          leftGlyph={<Icon glyph="Code" />}
          onClick={onExportToLanguage}
          data-testid="pipeline-toolbar-export-button"
        >
          Export to language
        </Button>
        <div>
          <b>Preview (sample of {sampleDocuments.length} documents)</b>
          {preview}
        </div>
      </ModalBody>
      <ModalFooter className={modalFooterSpacingStyles}>
        <Button variant="danger" onClick={onConfirmDeletion}>
          Delete {documentCount} documents
        </Button>
        <Button variant="default" onClick={onCancel}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BulkDeleteModal;

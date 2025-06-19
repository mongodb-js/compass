import React from 'react';
import type HadronDocument from 'hadron-document';
import { KeylineCard } from '@mongodb-js/compass-components';
import Document, { type DocumentProps } from './document';
import { useDocumentItemContextMenu } from './use-document-item-context-menu';

export type DocumentListViewItemProps = {
  doc: HadronDocument;
  docRef: React.Ref<HTMLDivElement>;
  docIndex: number;
  isEditable: boolean;
  isTimeSeries?: boolean;
  scrollTriggerRef?: React.Ref<HTMLDivElement>;
} & Pick<
  DocumentProps,
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

const DocumentListViewItem: React.FC<DocumentListViewItemProps> = ({
  doc,
  docRef,
  docIndex,
  isEditable,
  isTimeSeries,
  scrollTriggerRef,
  copyToClipboard,
  removeDocument,
  replaceDocument,
  updateDocument,
  openInsertDocumentDialog,
}) => {
  const ref = useDocumentItemContextMenu({
    doc,
    isEditable,
    copyToClipboard,
    openInsertDocumentDialog,
  });

  return (
    <div ref={ref}>
      <KeylineCard ref={docRef}>
        {scrollTriggerRef && docIndex === 0 && <div ref={scrollTriggerRef} />}
        <Document
          doc={doc}
          key={doc.uuid}
          editable={isEditable}
          isTimeSeries={isTimeSeries}
          copyToClipboard={copyToClipboard}
          removeDocument={removeDocument}
          replaceDocument={replaceDocument}
          updateDocument={updateDocument}
          openInsertDocumentDialog={openInsertDocumentDialog}
        />
      </KeylineCard>
    </div>
  );
};

export { DocumentListViewItem };

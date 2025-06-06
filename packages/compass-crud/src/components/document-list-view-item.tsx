import React from 'react';
import type HadronDocument from 'hadron-document';
import { KeylineCard } from '@mongodb-js/compass-components';
import Document, { type DocumentProps } from './document';
import { useContextMenuItems } from '@mongodb-js/compass-components';

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
  const ref = useContextMenuItems([
    {
      label: doc.expanded ? 'Collapse all fields' : 'Expand all fields',
      onAction: () => {
        if (doc.expanded) {
          doc.collapse();
        } else {
          doc.expand();
        }
      },
    },
    ...(!doc.editing
      ? [
          {
            label: 'Edit document',
            onAction: () => {
              doc.startEditing();
            },
          },
        ]
      : []),
    {
      label: 'Copy document',
      onAction: () => {
        copyToClipboard?.(doc);
      },
    },
    {
      label: 'Clone document...',
      onAction: () => {
        const clonedDoc = doc.generateObject({
          excludeInternalFields: true,
        });
        openInsertDocumentDialog?.(clonedDoc, true);
      },
    },
    {
      label: 'Delete document',
      onAction: () => {
        doc.markForDeletion();
      },
    },
  ]);

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

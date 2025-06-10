import React from 'react';
import type HadronDocument from 'hadron-document';
import { css, KeylineCard } from '@mongodb-js/compass-components';

import JSONEditor, { type JSONEditorProps } from './json-editor';
import { useContextMenuItems } from '@mongodb-js/compass-components';

const keylineCardStyles = css({
  overflow: 'hidden',
  position: 'relative',
});

export type DocumentJsonViewItemProps = {
  doc: HadronDocument;
  docRef: React.Ref<HTMLDivElement>;
  docIndex: number;
  namespace: string;
  isEditable: boolean;
  isTimeSeries?: boolean;
  scrollTriggerRef?: React.Ref<HTMLDivElement>;
} & Pick<
  JSONEditorProps,
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

const DocumentJsonViewItem: React.FC<DocumentJsonViewItemProps> = ({
  doc,
  docRef,
  docIndex,
  namespace,
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
    ...(isEditable && !doc.editing
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
    ...(isEditable
      ? [
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
        ]
      : []),
  ]);

  return (
    <div ref={ref}>
      <KeylineCard className={keylineCardStyles} ref={docRef}>
        {scrollTriggerRef && docIndex === 0 && <div ref={scrollTriggerRef} />}
        <JSONEditor
          doc={doc}
          key={doc.uuid}
          namespace={namespace}
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

export { DocumentJsonViewItem };

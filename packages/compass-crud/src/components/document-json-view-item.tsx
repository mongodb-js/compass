import React from 'react';
import type HadronDocument from 'hadron-document';
import { css, KeylineCard, spacing } from '@mongodb-js/compass-components';

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
      label: 'Update document',
      onAction: () => {
        updateDocument?.(doc);
      },
    },
    {
      label: 'Copy document',
      onAction: () => {
        copyToClipboard?.(doc);
      },
    },
    {
      label: 'Delete document',
      onAction: () => {
        removeDocument?.(doc);
      },
    },
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

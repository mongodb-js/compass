import React, { useCallback } from 'react';
import type HadronDocument from 'hadron-document';
import { KeylineCard } from '@mongodb-js/compass-components';
import Document, { type DocumentProps } from './document';
import { useDocumentItemContextMenu } from './use-document-item-context-menu';
import { useMergeRefs } from '@mongodb-js/compass-components';
import {
  useChangeQueryBarQuery,
  useQueryBarQuery,
} from '@mongodb-js/compass-query-bar';

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
  const contextMenuRef = useDocumentItemContextMenu({
    doc,
    isEditable,
    copyToClipboard,
    openInsertDocumentDialog,
  });

  const changeQuery = useChangeQueryBarQuery();
  const queryBarQuery = useQueryBarQuery();

  const handleAddToQuery = useCallback(
    (field: string, value: unknown) => {
      changeQuery('toggleDistinctValue', {
        field,
        value,
      });
    },
    [changeQuery]
  );

  const mergedRef = useMergeRefs([docRef, contextMenuRef]);

  return (
    <KeylineCard ref={mergedRef}>
      {scrollTriggerRef && docIndex === 0 && <div ref={scrollTriggerRef} />}
      <Document
        doc={doc}
        key={doc.uuid}
        query={queryBarQuery.filter}
        onUpdateQuery={handleAddToQuery}
        editable={isEditable}
        isTimeSeries={isTimeSeries}
        copyToClipboard={copyToClipboard}
        removeDocument={removeDocument}
        replaceDocument={replaceDocument}
        updateDocument={updateDocument}
        openInsertDocumentDialog={openInsertDocumentDialog}
      />
    </KeylineCard>
  );
};

export { DocumentListViewItem };

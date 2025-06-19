import React, { useCallback } from 'react';
import type HadronDocument from 'hadron-document';
import {
  css,
  spacing,
  VirtualList,
  type VirtualListRef,
  type VirtualListItemRenderer,
} from '@mongodb-js/compass-components';

import type { JSONEditorProps } from './json-editor';
import { DocumentJsonViewItem } from './document-json-view-item';

const spacingStyles = css({
  padding: spacing[400],
  paddingTop: 0,
  paddingRight: spacing[150],
});

const estimateDocumentInitialHeight = (doc: HadronDocument) => {
  const keylineCardBorder = spacing[25] + spacing[25];
  const codeMirrorPadding = spacing[100] + spacing[100];
  const openingClosingBracketsHeight = spacing[400] + spacing[400];
  const elementsHeight = doc.elements.size * spacing[400];
  return (
    keylineCardBorder +
    codeMirrorPadding +
    openingClosingBracketsHeight +
    elementsHeight
  );
};

export type VirtualizedDocumentJsonViewProps = {
  namespace: string;
  docs: HadronDocument[];
  isEditable: boolean;
  initialScrollTop?: number;
  scrollTriggerRef?: React.Ref<HTMLDivElement>;
  scrollableContainerRef?: React.Ref<HTMLDivElement>;
  listRef?: VirtualListRef;
  __TEST_OVERSCAN_COUNT?: number;
  __TEST_LIST_HEIGHT?: number;
} & Pick<
  JSONEditorProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

const VirtualizedDocumentJsonView: React.FC<
  VirtualizedDocumentJsonViewProps
> = ({
  docs,
  namespace,
  isEditable,
  isTimeSeries,
  initialScrollTop,
  scrollTriggerRef,
  scrollableContainerRef,
  copyToClipboard,
  removeDocument,
  replaceDocument,
  updateDocument,
  openInsertDocumentDialog,
  __TEST_OVERSCAN_COUNT,
  __TEST_LIST_HEIGHT,
  listRef,
}) => {
  const renderItem: VirtualListItemRenderer<HadronDocument> = useCallback(
    (
      doc: HadronDocument,
      docRef: React.Ref<HTMLDivElement>,
      docIndex: number
    ) => {
      return (
        <DocumentJsonViewItem
          doc={doc}
          docRef={docRef}
          docIndex={docIndex}
          namespace={namespace}
          isEditable={isEditable}
          isTimeSeries={isTimeSeries}
          scrollTriggerRef={scrollTriggerRef}
          copyToClipboard={copyToClipboard}
          removeDocument={removeDocument}
          replaceDocument={replaceDocument}
          updateDocument={updateDocument}
          openInsertDocumentDialog={openInsertDocumentDialog}
        />
      );
    },
    [
      isEditable,
      isTimeSeries,
      namespace,
      scrollTriggerRef,
      copyToClipboard,
      openInsertDocumentDialog,
      removeDocument,
      replaceDocument,
      updateDocument,
    ]
  );

  return (
    <VirtualList
      items={docs}
      renderItem={renderItem}
      estimateItemInitialHeight={estimateDocumentInitialHeight}
      rowGap={spacing[200]}
      itemDataTestId="document-json-item"
      // Keeping the overscanCount low here helps us avoid scroll dangling
      // issues
      overScanCount={__TEST_OVERSCAN_COUNT ?? 1}
      listOuterContainerClassName={spacingStyles}
      initialScrollTop={initialScrollTop}
      scrollableContainerRef={scrollableContainerRef}
      listRef={listRef}
      __TEST_LIST_HEIGHT={__TEST_LIST_HEIGHT}
    ></VirtualList>
  );
};

export default VirtualizedDocumentJsonView;

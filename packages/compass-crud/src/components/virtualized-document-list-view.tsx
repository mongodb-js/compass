import React, { useCallback, useMemo } from 'react';
import HadronDocument from 'hadron-document';
import {
  KeylineCard,
  spacing,
  VirtualList,
  type VirtualListItemRenderer,
  type VirtualListRef,
} from '@mongodb-js/compass-components';

import { type BSONObject } from '../stores/crud-store';
import Document, { type DocumentProps } from './document';

const estimateDocumentInitialHeight = (doc: HadronDocument) => {
  const DEFAULT_VISIBLE_FIELDS = 25;
  const keylineCardBorder = spacing[25] + spacing[25];
  // top and bottom padding taken up by the document card
  const occupiedStaticSizePerItem = spacing[400] + spacing[400];
  // total size occupied by the "Show more fields" button whenever visible
  const showMoreButtonSize =
    DEFAULT_VISIBLE_FIELDS < doc.elements.size
      ? spacing[400] + spacing[200]
      : 0;
  // total size occupied by initially rendered fields
  const visibleFieldsSize =
    Math.min(DEFAULT_VISIBLE_FIELDS, doc.elements.size) *
    (spacing[400] + spacing[25]);

  return (
    keylineCardBorder +
    occupiedStaticSizePerItem +
    showMoreButtonSize +
    visibleFieldsSize
  );
};

type VirtualizedDocumentListViewProps = {
  docs: (HadronDocument | BSONObject)[];
  isEditable: boolean;
  className?: string;
  initialScrollTop?: number;
  scrollTriggerRef?: React.Ref<HTMLDivElement>;
  scrollableContainerRef?: React.Ref<HTMLDivElement>;
  __TEST_OVERSCAN_COUNT?: number;
  __TEST_LIST_HEIGHT?: number;
  __TEST_LIST_REF?: VirtualListRef;
} & Pick<
  DocumentProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

const VirtualizedDocumentListView: React.FC<
  VirtualizedDocumentListViewProps
> = ({
  docs: _docs,
  isEditable,
  className,
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
  __TEST_LIST_REF,
}) => {
  const docs = useMemo(() => {
    return _docs.map((_doc) => {
      // COMPASS-5872 If doc is a plain js object rather than an instance of hadron-document Document
      // it may have an isRoot prop, which would cause the isRoot() to throw an error.
      if (typeof _doc?.isRoot === 'function' && _doc?.isRoot()) {
        return _doc as HadronDocument;
      }
      return new HadronDocument(_doc as any);
    });
  }, [_docs]);

  const renderItem: VirtualListItemRenderer<HadronDocument> = useCallback(
    (doc, docRef, docIndex) => {
      return (
        <>
          {scrollTriggerRef && docIndex === 0 && <div ref={scrollTriggerRef} />}
          <KeylineCard ref={docRef}>
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
        </>
      );
    },
    [
      isEditable,
      isTimeSeries,
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
      className={className}
      dataTestId="document-list"
      itemDataTestId="document-list-item"
      initialScrollTop={initialScrollTop}
      scrollableContainerRef={scrollableContainerRef}
      overScanCount={__TEST_OVERSCAN_COUNT}
      __TEST_LIST_HEIGHT={__TEST_LIST_HEIGHT}
      __TEST_LIST_REF={__TEST_LIST_REF}
    ></VirtualList>
  );
};

export default VirtualizedDocumentListView;

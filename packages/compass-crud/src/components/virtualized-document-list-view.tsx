import React, { useLayoutEffect, useMemo, useRef } from 'react';
import Autosizer from 'react-virtualized-auto-sizer';
import {
  VariableSizeList as List,
  type ListChildComponentProps,
} from 'react-window';
import HadronDocument from 'hadron-document';
import { css, cx, KeylineCard, spacing } from '@mongodb-js/compass-components';

import { type BSONObject } from '../stores/crud-store';
import Document, { type DocumentProps } from './document';
import {
  useReactWindowListItemObserver,
  type ListItemObserver,
} from './use-items-height-observer';

const containerStyles = css({
  width: '100%',
  height: '100%',
  position: 'relative',
});

const calculateInitialDocumentCardHeight = (doc: HadronDocument) => {
  const DEFAULT_VISIBLE_FIELDS = 25;
  const keylineCardBorder = spacing[25] + spacing[25];
  // top and bottom padding taken up by the document card
  const occupiedStaticSizePerItem = spacing[400] + spacing[400];
  // total size occupied by the "Show more fields" button whenever visible
  const showMoreButtonSize =
    DEFAULT_VISIBLE_FIELDS < doc.elements.size
      ? 38 //spacing[400] + spacing[400]
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
} & Pick<
  DocumentProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

type ItemData = Omit<
  VirtualizedDocumentListViewProps,
  'docs' | 'className' | 'initialScrollTop' | 'scrollableContainerRef'
> & {
  docs: HadronDocument[];
  observer: ListItemObserver;
};

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
}) => {
  const listRef = useRef<List | null>(null);
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

  const { observer, estimatedItemSize, getItemSize } =
    useReactWindowListItemObserver({
      rowGap: spacing[200],
      listRef,
      items: docs,
      estimateItemInitialHeight: calculateInitialDocumentCardHeight,
    });

  const itemData: ItemData = useMemo(
    () => ({
      docs,
      isEditable,
      isTimeSeries,
      observer,
      scrollTriggerRef,
      copyToClipboard,
      removeDocument,
      replaceDocument,
      updateDocument,
      openInsertDocumentDialog,
    }),
    [
      docs,
      isEditable,
      isTimeSeries,
      observer,
      scrollTriggerRef,
      copyToClipboard,
      removeDocument,
      replaceDocument,
      updateDocument,
      openInsertDocumentDialog,
    ]
  );

  return (
    <div className={cx(containerStyles, className)}>
      <Autosizer>
        {({ width, height }) => (
          <List<ItemData>
            ref={listRef}
            width={width}
            height={height}
            itemData={itemData}
            itemCount={docs.length}
            estimatedItemSize={estimatedItemSize}
            itemSize={getItemSize}
            initialScrollOffset={initialScrollTop}
            outerRef={scrollableContainerRef}
          >
            {DocumentRow}
          </List>
        )}
      </Autosizer>
    </div>
  );
};

const DocumentRow: React.FC<ListChildComponentProps<ItemData>> = ({
  index,
  style,
  data,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const {
    docs,
    isEditable,
    isTimeSeries,
    observer,
    scrollTriggerRef,
    copyToClipboard,
    removeDocument,
    replaceDocument,
    updateDocument,
    openInsertDocumentDialog,
  } = data;
  const doc = docs[index];

  useLayoutEffect(() => {
    const documentRefCurrent = documentRef.current;
    if (documentRefCurrent) {
      observer.observe(documentRefCurrent, index);
    }

    return () => {
      if (documentRefCurrent) {
        observer.unobserve(documentRefCurrent, index);
      }
    };
  }, [observer, index]);

  return (
    <>
      {scrollTriggerRef && index === 0 && <div ref={scrollTriggerRef} />}
      <div key={index} style={style}>
        <KeylineCard data-testid="document-list-item" ref={documentRef}>
          <Document
            doc={doc}
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
    </>
  );
};

export default VirtualizedDocumentListView;

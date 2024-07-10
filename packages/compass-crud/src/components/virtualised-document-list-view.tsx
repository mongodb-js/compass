import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { KeylineCard, css, cx, spacing } from '@mongodb-js/compass-components';
import {
  VariableSizeList as List,
  type ListChildComponentProps,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import type { DocumentProps } from './document';
import Document from './document';
import HadronDocument from 'hadron-document';
import { DocumentEvents, ElementEvents } from 'hadron-document';
import { debounce } from 'lodash';

const containerStyles = css({
  width: '100%',
  height: '100%',
});

const virtualisedDocumentStyles = css({
  position: 'relative',
  marginBottom: spacing[100],

  '&:last-child': {
    marginBottom: 0,
    borderBottom: '0 solid transparent',
  },
});

type VirtualisedDocumentListViewProps = {
  docs: HadronDocument[];
  className?: string;
  isEditable: boolean;
} & Pick<
  DocumentProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

type VirtualisedDocumentData = Omit<
  VirtualisedDocumentListViewProps,
  'className'
>;

type VirtualisedDocumentProps =
  ListChildComponentProps<VirtualisedDocumentData> & {
    cardWidth: number;
    setDocumentCardSize(this: void, index: number, size: number): void;
  };

const VirtualisedDocument: React.FC<VirtualisedDocumentProps> = ({
  index,
  data,
  style,
  cardWidth,
  setDocumentCardSize,
}) => {
  const {
    docs,
    isEditable,
    isTimeSeries,
    copyToClipboard,
    removeDocument,
    replaceDocument,
    updateDocument,
    openInsertDocumentDialog,
  } = data;
  const doc = useMemo(() => docs[index], [docs, index]);
  const docRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const resetHeight = debounce(() => {
      if (docRef.current) {
        const height = docRef.current.getBoundingClientRect().height;
        setDocumentCardSize(index, height);
      }
    }, 10);
    resetHeight();
    doc.on(ElementEvents.Added, resetHeight);
    doc.on(ElementEvents.Removed, resetHeight);
    doc.on(ElementEvents.Expanded, resetHeight);
    doc.on(ElementEvents.Collapsed, resetHeight);
    doc.on(DocumentEvents.VisibleElementsChanged, resetHeight);
    doc.on(ElementEvents.VisibleElementsChanged, resetHeight);
    return () => {
      doc.off(ElementEvents.Added, resetHeight);
      doc.off(ElementEvents.Removed, resetHeight);
      doc.off(ElementEvents.Expanded, resetHeight);
      doc.off(ElementEvents.Collapsed, resetHeight);
      doc.off(DocumentEvents.VisibleElementsChanged, resetHeight);
      doc.off(ElementEvents.VisibleElementsChanged, resetHeight);
    };
  }, [setDocumentCardSize, index, doc, cardWidth]);

  return (
    <div
      className={virtualisedDocumentStyles}
      data-testid="document-list-item"
      key={index}
      style={style}
    >
      <KeylineCard ref={docRef}>
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
  );
};

export const VirtualisedDocumentListView: React.FC<
  VirtualisedDocumentListViewProps
> = ({
  docs: _docs,
  className,
  isEditable,
  isTimeSeries,
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
        return _doc;
      }
      return new HadronDocument(_doc as any);
    });
  }, [_docs]);

  const itemData = useMemo(
    () => ({
      docs,
      isEditable,
      isTimeSeries,
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
      copyToClipboard,
      removeDocument,
      replaceDocument,
      updateDocument,
      openInsertDocumentDialog,
    ]
  );

  const documentCardSizesRef = useRef<Record<number, number>>({});

  const setDocumentCardSize = useCallback((index: number, size: number) => {
    documentCardSizesRef.current = {
      ...documentCardSizesRef.current,
      [index]: size,
    };
    listRef.current?.resetAfterIndex(index, true);
  }, []);

  const calculateInitialDocumentCardHeight = useCallback(
    (doc: HadronDocument) => {
      // top and bottom padding taken up by the document card
      const occupiedStaticSizePerItem = spacing[400] + spacing[400];
      // total size occupied by the "Show more fields" button whenever visible
      const showMoreButtonSize =
        doc.visibleElementsCount < doc.elements.size ? 38 : 0;
      // total size occupied by initially rendered fields
      const visibleFieldsSize =
        doc.getTotalVisibleElementsCount() * (spacing[400] + spacing[25]);
      const totalSize =
        occupiedStaticSizePerItem + showMoreButtonSize + visibleFieldsSize;
      return totalSize;
    },
    []
  );

  // We need to provide the VariableSizeList and estimate of the size of the
  // document cards so that it can appropriately adjust the scroll length and
  // behavior. We do that by taking an average of initial card heights because
  // the provided estimate will get updated when new items are rendered.
  const averageDocumentCardSize = useMemo(() => {
    return (
      docs.reduce((totalSize, doc) => {
        return totalSize + calculateInitialDocumentCardHeight(doc);
      }, 0) / docs.length
    );
  }, [docs, calculateInitialDocumentCardHeight]);

  const getDocumentCardSize = useCallback(
    (docIndex: number) => {
      const document = docs[docIndex];
      const actualSize =
        documentCardSizesRef.current[docIndex] ??
        calculateInitialDocumentCardHeight(document);
      if (docIndex === docs.length - 1) {
        return actualSize;
      }
      const marginBetweenDocuments = spacing[100];
      return actualSize + marginBetweenDocuments;
    },
    [docs, calculateInitialDocumentCardHeight]
  );

  return (
    <div
      className={cx(containerStyles, className)}
      data-testid="virtual-document-list"
    >
      <AutoSizer>
        {({ width, height }) => (
          <List<VirtualisedDocumentData>
            ref={listRef}
            width={width}
            height={height}
            itemData={itemData}
            itemCount={docs.length}
            itemSize={getDocumentCardSize}
            estimatedItemSize={averageDocumentCardSize}
          >
            {({ index, data, style }) => (
              <VirtualisedDocument
                index={index}
                data={data}
                style={style}
                cardWidth={width}
                setDocumentCardSize={setDocumentCardSize}
              />
            )}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

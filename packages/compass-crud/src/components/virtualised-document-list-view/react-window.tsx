import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  memo,
} from 'react';
import { KeylineCard, css, cx, spacing } from '@mongodb-js/compass-components';
import {
  VariableSizeList as List,
  areEqual,
  type ListChildComponentProps,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import type { DocumentProps } from '../document';
import Document from '../document';
import HadronDocument from 'hadron-document';

const containerStyles = css({
  width: '100%',
  height: '100%',
});

const virtualisedDocumentStyles = css({
  position: 'relative',
  '&:last-child': {
    borderBottom: '0 solid transparent',
  },
});

type VirtualisedDocumentListViewProps = {
  docs: HadronDocument[];
  isEditable: boolean;
  className?: string;
  initialScrollTop?: number;
  scrollableContainerRef?: React.MutableRefObject<HTMLElement | null>;
  compassSearchActive?: boolean;
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
  'className' | 'initialScrollTop' | 'scrollableContainerRef'
> & {
  setDocumentCardSize(this: void, index: number, size: number): void;
};

const VirtualisedDocument: React.FC<
  ListChildComponentProps<VirtualisedDocumentData>
> = memo(function VirtualisedDocument({ index, data, style }) {
  const {
    docs,
    isEditable,
    isTimeSeries,
    copyToClipboard,
    removeDocument,
    replaceDocument,
    updateDocument,
    openInsertDocumentDialog,
    setDocumentCardSize,
  } = data;
  const doc = useMemo(() => docs[index], [docs, index]);
  const docCardRef = useRef<HTMLDivElement | null>(null);
  const setDocumentCardSizeRef = useRef((size: number) =>
    setDocumentCardSize(index, size)
  );
  setDocumentCardSizeRef.current = (size: number) =>
    setDocumentCardSize(index, size);

  useLayoutEffect(() => {
    let reqId: number;
    const observer = new ResizeObserver(([entry]) => {
      cancelAnimationFrame(reqId);
      reqId = requestAnimationFrame(() => {
        setDocumentCardSizeRef.current(entry.contentRect.height);
      });
    });

    if (docCardRef.current) {
      observer.observe(docCardRef.current);
    }
    return () => {
      cancelAnimationFrame(reqId);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      className={virtualisedDocumentStyles}
      data-testid="document-list-item"
      key={index}
      style={style}
    >
      <KeylineCard ref={docCardRef}>
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
}, areEqual);

export const VirtualisedDocumentListView: React.FC<
  VirtualisedDocumentListViewProps
> = ({
  docs: _docs,
  className,
  isEditable,
  isTimeSeries,
  initialScrollTop,
  scrollableContainerRef,
  copyToClipboard,
  removeDocument,
  replaceDocument,
  updateDocument,
  openInsertDocumentDialog,
  compassSearchActive,
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

  const calculateInitialDocumentCardHeight = useCallback(
    (doc: HadronDocument) => {
      const DEFAULT_VISIBLE_FIELDS = 25;
      // top and bottom padding taken up by the document card
      const occupiedStaticSizePerItem = spacing[400] + spacing[400];
      // total size occupied by the "Show more fields" button whenever visible
      const showMoreButtonSize =
        DEFAULT_VISIBLE_FIELDS < doc.elements.size
          ? spacing[400] + spacing[400]
          : 0;
      // total size occupied by initially rendered fields
      const visibleFieldsSize =
        Math.min(DEFAULT_VISIBLE_FIELDS, doc.elements.size) *
        (spacing[400] + spacing[25]);
      const totalSize =
        occupiedStaticSizePerItem + showMoreButtonSize + visibleFieldsSize;
      return totalSize;
    },
    []
  );

  const [documentCardSizes, setDocumentCardSizes] = useState<number[]>(
    docs.map(calculateInitialDocumentCardHeight)
  );

  const getDocumentCardSize = useCallback(
    (index: number) => {
      const actualSize = documentCardSizes[index];
      if (index === documentCardSizes.length - 1) {
        return actualSize;
      }
      const marginBetweenDocuments = spacing[150];
      return actualSize + marginBetweenDocuments;
    },
    [documentCardSizes]
  );

  const handleDocumentCardSizeChange = useCallback(
    (index: number, newSize: number) => {
      const oldSize = documentCardSizes[index];
      if (oldSize === newSize) {
        return;
      }

      const newSizes = [...documentCardSizes];
      newSizes.splice(index, 1, newSize);
      setDocumentCardSizes(newSizes);
      listRef.current?.resetAfterIndex(index);
    },
    [documentCardSizes]
  );

  const averageDocumentCardSize = useMemo(() => {
    return (
      documentCardSizes.reduce((totalSize, size) => totalSize + size, 0) /
      documentCardSizes.length
    );
  }, [documentCardSizes]);

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
      setDocumentCardSize: handleDocumentCardSizeChange,
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
      handleDocumentCardSizeChange,
    ]
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
            outerRef={scrollableContainerRef}
            initialScrollOffset={initialScrollTop}
            width={width}
            height={height}
            itemData={itemData}
            itemCount={docs.length}
            itemSize={getDocumentCardSize}
            estimatedItemSize={averageDocumentCardSize}
            overscanCount={compassSearchActive ? docs.length : 4}
          >
            {VirtualisedDocument}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

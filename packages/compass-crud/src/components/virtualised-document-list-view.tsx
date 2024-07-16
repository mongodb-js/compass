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
  type ListOnItemsRenderedProps,
  type ListChildComponentProps,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

import type { DocumentProps } from './document';
import Document from './document';
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

const overScannedCardStyles = css({
  height: '400px',
  overflowY: 'scroll',
  scrollbarGutter: 'stable',
  wordWrap: 'break-word',
  overflowX: 'hidden',
  padding: spacing[400],
});

type VirtualisedDocumentListViewProps = {
  docs: HadronDocument[];
  isEditable: boolean;
  className?: string;
  initialScrollTop?: number;
  scrollableContainerRef?: React.Ref<HTMLElement>;
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
  isOverScanRender(this: void, index: number): boolean;
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
    isOverScanRender,
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
      {isOverScanRender(index) ? (
        <KeylineCard ref={docCardRef}>
          <div className={overScannedCardStyles}>{doc.toEJSON('original')}</div>
        </KeylineCard>
      ) : (
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
      )}
    </div>
  );
}, areEqual);

const VirtualisedDocumentListView: React.FC<
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
      // top and bottom padding taken up by the document card
      const occupiedStaticSizePerItem = spacing[400] + spacing[400];
      // total size occupied by the "Show more fields" button whenever visible
      const showMoreButtonSize =
        doc.maxVisibleElementsCount < doc.elements.size
          ? spacing[400] + spacing[400]
          : 0;
      // total size occupied by initially rendered fields
      const visibleFieldsSize =
        doc.getTotalVisibleElementsCount() * (spacing[400] + spacing[25]);
      const totalSize =
        occupiedStaticSizePerItem + showMoreButtonSize + visibleFieldsSize;
      return totalSize;
    },
    []
  );

  const [documentCardSizes, setDocumentCardSizes] = useState<number[]>(
    docs.map(calculateInitialDocumentCardHeight)
  );

  const renderStateRef = useRef<{
    overscanStartIndex: number;
    overscanStopIndex: number;
    visibleStartIndex: number;
    visibleStopIndex: number;
  } | null>(null);

  const isOverScanRender = useCallback((rowIndex: number) => {
    if (!renderStateRef.current) {
      return false;
    }
    const {
      overscanStartIndex,
      overscanStopIndex,
      visibleStartIndex,
      visibleStopIndex,
    } = renderStateRef.current;

    const isOverScan = (() => {
      // We consider at-least 2 elements above and below the visible elements to
      // also be visible. This is done to avoid possible visual disruption when
      // scrolling because the overscanned items when rendered are rendered
      // simply as json in a list for browser search to work and it is not
      // pretty to look at, at all.
      if (
        visibleStartIndex - 2 <= rowIndex &&
        rowIndex <= visibleStopIndex + 2
      ) {
        return false;
      }

      return overscanStartIndex <= rowIndex && rowIndex <= overscanStopIndex;
    })();

    // console.table({
    //   rowIndex,
    //   overscanStartIndex,
    //   overscanStopIndex,
    //   visibleStartIndex,
    //   visibleStopIndex,
    //   isOverScan
    // });

    return isOverScan;
  }, []);

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
      isOverScanRender: isOverScanRender,
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
      isOverScanRender,
    ]
  );

  const onItemsRendered = useCallback((props: ListOnItemsRenderedProps) => {
    renderStateRef.current = props;
  }, []);

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
            onItemsRendered={onItemsRendered}
          >
            {VirtualisedDocument}
          </List>
        )}
      </AutoSizer>
    </div>
  );
};

export default VirtualisedDocumentListView;

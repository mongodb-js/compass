import React, { useCallback, useMemo } from 'react';
import { KeylineCard, css, cx, spacing } from '@mongodb-js/compass-components';
import HadronDocument from 'hadron-document';
import { Virtuoso } from 'react-virtuoso';

import type { DocumentProps } from '../document';
import Document from '../document';

const containerStyles = css({
  width: '100%',
  height: '100%',
});

const virtualisedDocumentStyles = css({
  position: 'relative',
  marginBottom: spacing[100],
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
} & Pick<
  DocumentProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

export const VirtuosoVirtualisedDocumentListView: React.FC<
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
}) => {
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

  const averageDocumentCardSize = useMemo(() => {
    const documentCardSizes = docs.map(calculateInitialDocumentCardHeight);
    return (
      documentCardSizes.reduce((totalSize, size) => totalSize + size, 0) /
      documentCardSizes.length
    );
  }, [docs, calculateInitialDocumentCardHeight]);

  const setScrollerRef = useCallback(
    (ref: HTMLElement | Window | null) => {
      if (ref instanceof HTMLDivElement && scrollableContainerRef) {
        scrollableContainerRef.current = ref;
      }
    },
    [scrollableContainerRef]
  );

  const computeItemKey = useCallback((_: unknown, doc: HadronDocument) => {
    return doc.uuid;
  }, []);

  const itemContent = useCallback(
    (_: unknown, doc: HadronDocument) => {
      return (
        <div
          className={virtualisedDocumentStyles}
          data-testid="document-list-item"
          key={doc.uuid}
        >
          <KeylineCard>
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
    },
    [
      isEditable,
      isTimeSeries,
      copyToClipboard,
      removeDocument,
      replaceDocument,
      updateDocument,
      openInsertDocumentDialog,
    ]
  );

  return (
    <div
      className={cx(containerStyles, className)}
      data-testid="virtual-document-list"
    >
      <Virtuoso
        data={docs}
        scrollerRef={setScrollerRef}
        totalCount={docs.length}
        initialScrollTop={initialScrollTop}
        defaultItemHeight={averageDocumentCardSize}
        itemContent={itemContent}
        computeItemKey={computeItemKey}
      ></Virtuoso>
    </div>
  );
};

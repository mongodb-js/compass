import React, { useCallback, useMemo, useRef } from 'react';
import { KeylineCard, css, cx, spacing } from '@mongodb-js/compass-components';
import HadronDocument from 'hadron-document';
import { useVirtualizer } from '@tanstack/react-virtual';

import type { DocumentProps } from '../document';
import Document from '../document';

const containerStyles = css({
  width: '100%',
  height: '100%',
});

const tanStackContainerStyles = css({
  overflowY: 'auto',
  contain: 'strict',
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
  scrollableContainerRef: React.MutableRefObject<HTMLDivElement | null>;
} & Pick<
  DocumentProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
>;

function mergeRefs<T = any>(
  ...refs: React.ForwardedRef<T>[]
): React.RefCallback<T> {
  return (node: T) => {
    for (const ref of refs) {
      if (ref) {
        if (typeof ref === 'function') ref(node);
        if ('current' in ref) ref.current = node;
      }
    }
  };
}

export const TanstackVirtualisedDocumentListView: React.FC<
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
  const parentRef = useRef<HTMLDivElement>(null);
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

  const maxSize = useMemo(() => {
    return Math.max(...docs.map(calculateInitialDocumentCardHeight));
  }, [docs, calculateInitialDocumentCardHeight]);

  const getItemKey = useCallback(
    (idx: number) => {
      return docs[idx].uuid;
    },
    [docs]
  );

  const virtualizer = useVirtualizer({
    count: docs.length,
    getScrollElement: () => parentRef?.current,
    estimateSize: () => maxSize,
    initialOffset: initialScrollTop,
    getItemKey,
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div
      ref={mergeRefs(scrollableContainerRef, parentRef)}
      className={cx(containerStyles, tanStackContainerStyles, className)}
      data-testid="virtual-document-list"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualRow) => (
            <div
              className={virtualisedDocumentStyles}
              data-testid="document-list-item"
              key={virtualRow.key}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
            >
              <KeylineCard>
                <Document
                  doc={docs[virtualRow.index]}
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
          ))}
        </div>
      </div>
    </div>
  );
};

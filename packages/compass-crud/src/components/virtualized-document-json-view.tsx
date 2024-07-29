import React, { useLayoutEffect, useMemo, useRef } from 'react';
import Autosizer from 'react-virtualized-auto-sizer';
import {
  VariableSizeList as List,
  type ListChildComponentProps,
} from 'react-window';
import type HadronDocument from 'hadron-document';
import { css, cx, KeylineCard, spacing } from '@mongodb-js/compass-components';

import JSONEditor, { type JSONEditorProps } from './json-editor';
import {
  type ListItemObserver,
  useReactWindowListItemObserver,
} from './use-items-height-observer';

const containerStyles = css({
  width: '100%',
  height: '100%',
  position: 'relative',
});

const keylineCardStyles = css({
  overflow: 'hidden',
  position: 'relative',
});

const calculateInitialDocumentCardHeight = (doc: HadronDocument) => {
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
  className?: string;
  initialScrollTop?: number;
  scrollTriggerRef?: React.Ref<HTMLDivElement>;
  scrollableContainerRef?: React.Ref<HTMLDivElement>;
} & Pick<
  JSONEditorProps,
  | 'isTimeSeries'
  | 'copyToClipboard'
  | 'removeDocument'
  | 'replaceDocument'
  | 'updateDocument'
  | 'openInsertDocumentDialog'
  | 'isExpanded'
>;

type ItemData = Omit<
  VirtualizedDocumentJsonViewProps,
  'docs' | 'className' | 'initialScrollTop' | 'scrollableContainerRef'
> & {
  docs: HadronDocument[];
  observer: ListItemObserver;
};

const VirtualizedDocumentJsonView: React.FC<
  VirtualizedDocumentJsonViewProps
> = ({
  docs,
  namespace,
  isEditable,
  isExpanded,
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
      namespace,
      isEditable,
      isExpanded,
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
      namespace,
      isEditable,
      isExpanded,
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
            overscanCount={1}
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
    namespace,
    isEditable,
    isExpanded,
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
        <KeylineCard
          data-testid="document-json-item"
          className={keylineCardStyles}
          ref={documentRef}
        >
          <JSONEditor
            doc={doc}
            namespace={namespace}
            editable={isEditable}
            isTimeSeries={isTimeSeries}
            isExpanded={isExpanded}
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

export default VirtualizedDocumentJsonView;

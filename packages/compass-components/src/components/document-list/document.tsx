import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import type {
  default as HadronDocumentType,
  Element as HadronElementType,
} from 'hadron-document';
import {
  DEFAULT_VISIBLE_DOCUMENT_ELEMENTS,
  DocumentEvents,
  ElementEvents,
} from 'hadron-document';
import { AutoFocusContext } from './auto-focus-context';
import { useForceUpdate } from './use-force-update';
import { calculateShowMoreToggleOffset, HadronElement } from './element';
import { usePrevious } from './use-previous';
import VisibleFieldsToggle from './visible-field-toggle';
import { documentTypography } from './typography';

function useHadronDocument(doc: HadronDocumentType) {
  const prevDoc = usePrevious(doc);
  const forceUpdate = useForceUpdate();

  const onVisibleElementsChanged = useCallback(
    (document: HadronDocumentType) => {
      if (document === doc) {
        forceUpdate();
      }
    },
    [doc, forceUpdate]
  );

  const onDocumentFieldsAddedOrRemoved = useCallback(
    (
      _el: HadronElementType,
      parentEl: HadronElementType | HadronDocumentType | null
    ) => {
      // We only care about elements added or removed to the root document here
      // so that the root elements list can be correctly re-rendered. Everything
      // else will be handled correctly by HadronElement component
      if (doc === parentEl) {
        forceUpdate();
      }
    },
    [doc, forceUpdate]
  );

  useEffect(() => {
    // Force update if the document that was passed to the component changed
    if (prevDoc && prevDoc !== doc) {
      forceUpdate();
    }
  }, [prevDoc, doc, forceUpdate]);

  useEffect(() => {
    doc.on(DocumentEvents.VisibleElementsChanged, onVisibleElementsChanged);
    doc.on(ElementEvents.Added, onDocumentFieldsAddedOrRemoved);
    doc.on(ElementEvents.Removed, onDocumentFieldsAddedOrRemoved);

    return () => {
      doc.off(DocumentEvents.VisibleElementsChanged, onVisibleElementsChanged);
      doc.off(ElementEvents.Added, onDocumentFieldsAddedOrRemoved);
      doc.off(ElementEvents.Removed, onDocumentFieldsAddedOrRemoved);
    };
  }, [doc, onDocumentFieldsAddedOrRemoved, onVisibleElementsChanged]);

  return {
    elements: [...doc.elements],
    visibleElements: doc.getVisibleElements(),
  };
}

const hadronDocument = css({
  position: 'relative',
  fontFamily: documentTypography.fontFamily,
  fontSize: `${documentTypography.fontSize}px`,
  lineHeight: `${documentTypography.lineHeight}px`,
  counterReset: 'line-number',
});

// TODO: This element should implement treegrid aria role to be accessible
// https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html
// https://jira.mongodb.org/browse/COMPASS-5614
const HadronDocument: React.FunctionComponent<{
  value: HadronDocumentType;
  editable?: boolean;
  editing?: boolean;
  onEditStart?: () => void;
  extraGutterWidth?: number;
}> = ({
  value: document,
  editable = false,
  editing = false,
  onEditStart,
  extraGutterWidth,
}) => {
  const { elements, visibleElements } = useHadronDocument(document);
  const [autoFocus, setAutoFocus] = useState<{
    id: string;
    type: 'key' | 'value' | 'type';
  } | null>(null);

  useEffect(() => {
    if (!editing) {
      setAutoFocus(null);
    }
  }, [editing]);

  const handleVisibleFieldsChanged = useCallback(
    (totalVisibleFields: number) => {
      document.setMaxVisibleElementsCount(totalVisibleFields);
    },
    [document]
  );

  // To render the "Show more" toggle for the document we need to calculate a
  // proper offset so that it aligns with the expand icon of top level fields
  const showMoreToggleOffset = useMemo(
    () =>
      calculateShowMoreToggleOffset({
        editable,
        level: 0,
        alignWithNestedExpandIcon: false,
        extraGutterWidth,
      }),
    [editable, extraGutterWidth]
  );

  return (
    <div>
      <div
        className={hadronDocument}
        data-testid="hadron-document"
        data-id={document.uuid}
      >
        <AutoFocusContext.Provider value={autoFocus}>
          {visibleElements.map((el, idx) => {
            return (
              <HadronElement
                key={idx}
                value={el}
                editable={editable}
                editingEnabled={editing}
                onEditStart={
                  editable
                    ? (id, type) => {
                        setAutoFocus({ id, type });
                        onEditStart?.();
                      }
                    : undefined
                }
                lineNumberSize={visibleElements.length}
                onAddElement={(el) => {
                  setAutoFocus({
                    id: el.uuid,
                    type: el.parent?.currentType === 'Array' ? 'value' : 'key',
                  });
                }}
                extraGutterWidth={extraGutterWidth}
              ></HadronElement>
            );
          })}
        </AutoFocusContext.Provider>
      </div>
      <VisibleFieldsToggle
        // TODO: "Hide items" button will only be shown when document is not
        // edited because it's not decided how to handle changes to the fields
        // that are changed but then hidden
        // https://jira.mongodb.org/browse/COMPASS-5587
        showHideButton={!editing}
        currentSize={document.maxVisibleElementsCount}
        totalSize={elements.length}
        minSize={DEFAULT_VISIBLE_DOCUMENT_ELEMENTS}
        // In the editing mode we allow to show / hide less fields because
        // historically Compass was doing this for "performance" reasons
        step={editing ? 100 : 1000}
        onSizeChange={handleVisibleFieldsChanged}
        style={{
          paddingLeft: showMoreToggleOffset,
        }}
      ></VisibleFieldsToggle>
    </div>
  );
};

export default HadronDocument;

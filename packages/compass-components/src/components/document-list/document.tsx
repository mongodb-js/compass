import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import type {
  default as HadronDocumentType,
  Element as HadronElementType,
} from 'hadron-document';
import { ElementEvents } from 'hadron-document';
import { AutoFocusContext } from './auto-focus-context';
import { useForceUpdate } from './use-force-update';
import { HadronElement } from './element';
import { usePrevious } from './use-previous';
import DocumentFieldsToggleGroup from './document-fields-toggle-group';
import { documentTypography } from './typography';

function useHadronDocument(doc: HadronDocumentType) {
  const prevDoc = usePrevious(doc);
  const forceUpdate = useForceUpdate();

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
    doc.on(ElementEvents.Added, onDocumentFieldsAddedOrRemoved);
    doc.on(ElementEvents.Removed, onDocumentFieldsAddedOrRemoved);

    return () => {
      doc.off(ElementEvents.Added, onDocumentFieldsAddedOrRemoved);
      doc.off(ElementEvents.Removed, onDocumentFieldsAddedOrRemoved);
    };
  }, [doc, onDocumentFieldsAddedOrRemoved]);

  return {
    elements: [...doc.elements],
  };
}

const hadronDocument = css({
  position: 'relative',
  fontFamily: documentTypography.fontFamily,
  fontSize: `${documentTypography.fontSize}px`,
  lineHeight: `${documentTypography.lineHeight}px`,
  counterReset: 'line-number',
});

const INITIAL_FIELD_LIMIT = 25;

// TODO: This element should implement treegrid aria role to be accessible
// https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html
// https://jira.mongodb.org/browse/COMPASS-5614
const HadronDocument: React.FunctionComponent<{
  value: HadronDocumentType;
  editable?: boolean;
  editing?: boolean;
  onEditStart?: () => void;
}> = ({ value: document, editable = false, editing = false, onEditStart }) => {
  const { elements } = useHadronDocument(document);
  const [visibleFieldsCount, setVisibleFieldsCount] =
    useState(INITIAL_FIELD_LIMIT);
  const visibleElements = useMemo(() => {
    return elements.filter(Boolean).slice(0, visibleFieldsCount);
  }, [elements, visibleFieldsCount]);
  const [autoFocus, setAutoFocus] = useState<{
    id: string;
    type: 'key' | 'value' | 'type';
  } | null>(null);

  useEffect(() => {
    if (!editing) {
      setAutoFocus(null);
    }
  }, [editing]);

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
              ></HadronElement>
            );
          })}
        </AutoFocusContext.Provider>
      </div>
      <DocumentFieldsToggleGroup
        // TODO: "Hide items" button will only be shown when document is not
        // edited because it's not decided how to handle changes to the fields
        // that are changed but then hidden
        // https://jira.mongodb.org/browse/COMPASS-5587
        showHideButton={!editing}
        currentSize={visibleFieldsCount}
        totalSize={elements.length}
        minSize={INITIAL_FIELD_LIMIT}
        // In the editing mode we allow to show / hide less fields because
        // historically Compass was doing this for "performance" reasons
        step={editing ? 100 : 1000}
        onSizeChange={setVisibleFieldsCount}
      ></DocumentFieldsToggleGroup>
    </div>
  );
};

export default HadronDocument;

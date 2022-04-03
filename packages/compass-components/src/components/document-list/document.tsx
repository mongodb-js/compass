import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { css } from '@leafygreen-ui/emotion';
import type {
  default as HadronDocumentType,
  Element as HadronElementType,
} from 'hadron-document';
import { ElementEvents } from 'hadron-document';
import { fontFamilies, spacing } from '@leafygreen-ui/tokens';
import { AutoFocusContext } from './auto-focus-context';
import { useForceUpdate } from './use-force-update';
import { HadronElement } from './element';

function useHadronDocument(doc: HadronDocumentType) {
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
  fontFamily: fontFamilies.code,
  fontSize: '12px',
  lineHeight: `${spacing[3]}px`,
  counterReset: 'line-number',
});

// TODO: This element should implement treegrid aria role to be accessible
// https://www.w3.org/TR/wai-aria-practices/examples/treegrid/treegrid-1.html
// https://jira.mongodb.org/browse/COMPASS-5614
const HadronDocument: React.FunctionComponent<{
  value: HadronDocumentType;
  visibleFieldsCount?: number;
  expanded?: boolean;
  editable?: boolean;
  editing?: boolean;
  onEditStart?: () => void;
}> = ({
  value: document,
  visibleFieldsCount,
  expanded = false,
  editable = false,
  editing = false,
  onEditStart,
}) => {
  const { elements } = useHadronDocument(document);
  const visibleElements = useMemo(() => {
    return elements.filter(Boolean).slice(0, visibleFieldsCount);
  }, [elements, visibleFieldsCount]);
  const [autoFocus, setAutoFocus] = useState<{
    id: string;
    type: 'key' | 'value';
  } | null>(null);

  useEffect(() => {
    if (!editing) {
      setAutoFocus(null);
    }
  }, [editing]);

  return (
    <div
      className={hadronDocument}
      data-testid="hadron-document"
      data-id={document.uuid}
    >
      <AutoFocusContext.Provider value={autoFocus}>
        {visibleElements.map((el) => {
          return (
            <HadronElement
              value={el}
              key={el.uuid}
              editable={editable}
              editingEnabled={editing}
              allExpanded={expanded}
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
  );
};

export default HadronDocument;

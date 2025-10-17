import React, { useCallback, useState, useEffect } from 'react';

import { useContextMenuGroups } from '../components/context-menu';

const NON_TEXT_INPUT_TYPES = [
  'checkbox',
  'radio',
  'submit',
  'button',
  'image',
  'file',
  'color',
  'range',
];
const SELECTION_EVENTS = [
  'selectionchange',
  'focusin',
  'focusout',
  'input',
  'keyup',
  'mouseup',
  'contextmenu',
];

const isEditableTextElement = (
  element: Element | null
): element is HTMLElement => {
  if (!element) return false;

  const tagName = element.tagName.toLowerCase();

  if (tagName === 'input') {
    const inputType = (element as HTMLInputElement).type.toLowerCase();
    return (
      !NON_TEXT_INPUT_TYPES.includes(inputType) &&
      !(element as HTMLInputElement).readOnly
    );
  }

  if (tagName === 'textarea') {
    return !(element as HTMLTextAreaElement).readOnly;
  }

  return element.getAttribute('contenteditable') === 'true';
};

function elementIsTextInput(
  element: Element | null
): element is HTMLInputElement | HTMLTextAreaElement {
  return (
    !!element && (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA')
  );
}

const getSelectionState = () => {
  const activeElement = document.activeElement;
  const selection = window.getSelection();

  let selectionStart = 0;
  let selectionEnd = 0;
  let selectedText = '';

  if (elementIsTextInput(activeElement)) {
    selectionStart = activeElement.selectionStart || 0;
    selectionEnd = activeElement.selectionEnd || 0;
    selectedText = activeElement.value.substring(selectionStart, selectionEnd);
  } else if (selection) {
    selectedText = selection.toString();
  }

  return {
    activeElement,
    selectionStart,
    selectionEnd,
    selectedText,
  };
};

export function useCopyPasteContextMenu() {
  const [editCapabilities, setEditCapabilities] = useState({
    canCut: false,
    canCopy: false,
    canPaste: false,
  });
  const [contextState, setContextState] = useState<{
    activeElement: Element | null;
    selectionStart: number;
    selectionEnd: number;
    selectedText: string;
  } | null>(null);

  useEffect(() => {
    const captureSelectionState = () => {
      const selectionState = getSelectionState();

      setContextState(selectionState);

      const hasSelection = selectionState.selectedText.length > 0;
      const isEditable = isEditableTextElement(selectionState.activeElement);

      setEditCapabilities({
        canCopy: hasSelection,
        canCut: hasSelection && isEditable,
        canPaste: isEditable,
      });
    };

    // Listen to events that can change selection or focus.
    // These impact if and what we can cut/copy/paste.
    SELECTION_EVENTS.forEach((event) =>
      document.addEventListener(event, captureSelectionState)
    );

    // Initial capture.
    captureSelectionState();

    return () => {
      SELECTION_EVENTS.forEach((event) =>
        document.removeEventListener(event, captureSelectionState)
      );
    };
  }, []);

  const onCut = useCallback(async () => {
    if (!contextState?.selectedText || !contextState.activeElement) return;

    const selectedText = contextState.selectedText;

    // The `execCommand` API is deprecated but still widely supported.
    // We try to use the Clipboard API when available.
    try {
      await navigator.clipboard.writeText(selectedText);
      document.execCommand('delete');
    } catch {
      // Fallback to execCommand cut.
      document.execCommand('cut');
    }
  }, [contextState]);

  const onCopy = useCallback(async () => {
    if (!contextState?.selectedText) return;

    await navigator.clipboard.writeText(contextState.selectedText);
  }, [contextState]);

  const onPaste = useCallback(async () => {
    if (!contextState?.activeElement) return;

    const element = contextState.activeElement;

    if (isEditableTextElement(element)) {
      try {
        const text = await navigator.clipboard.readText();
        document.execCommand('insertText', false, text);
      } catch {
        document.execCommand('paste');
      }
    }
  }, [contextState]);

  return useContextMenuGroups(
    () => [
      {
        telemetryLabel: 'Edit Menu',
        items: [
          editCapabilities.canCut
            ? {
                label: 'Cut',
                onAction: onCut,
              }
            : undefined,
          editCapabilities.canCopy
            ? {
                label: 'Copy',
                onAction: onCopy,
              }
            : undefined,
          editCapabilities.canPaste
            ? {
                label: 'Paste',
                onAction: onPaste,
              }
            : undefined,
        ].filter(Boolean),
      },
    ],
    [
      editCapabilities.canCut,
      editCapabilities.canCopy,
      editCapabilities.canPaste,
      onCut,
      onCopy,
      onPaste,
    ]
  );
}

const contextMenuContainerStyles = {
  display: 'contents',
};

export type CopyPasteContextMenuProps = {
  children: React.ReactNode;
};

export function CopyPasteContextMenu({ children }: CopyPasteContextMenuProps) {
  const contextMenuRef = useCopyPasteContextMenu();

  return (
    <div
      data-testid="copy-paste-context-menu-container"
      ref={contextMenuRef}
      style={contextMenuContainerStyles}
    >
      {children}
    </div>
  );
}

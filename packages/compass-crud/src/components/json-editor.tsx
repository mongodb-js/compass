import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from 'react';
import {
  css,
  cx,
  DocumentList,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';
import type { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';
import {
  createDocumentAutocompleter,
  CodemirrorMultilineEditor,
} from '@mongodb-js/compass-editor';
import type { EditorRef, Action } from '@mongodb-js/compass-editor';
import type { CrudActions } from '../stores/crud-store';
import { useAutocompleteFields } from '@mongodb-js/compass-field-store';

const editorStyles = css({
  minHeight: spacing[5] + spacing[3],
  // Special case only for this view that doesn't make sense to make part of
  // the editor component
  '& .cm-editor': {
    backgroundColor: `${palette.white} !important`,
  },
  '& .cm-gutters': {
    backgroundColor: `${palette.white} !important`,
  },
});

const editorDarkModeStyles = css({
  '& .cm-editor': {
    backgroundColor: `${palette.gray.dark4} !important`,
  },
  '& .cm-gutters': {
    backgroundColor: `${palette.gray.dark4} !important`,
  },
});

const actionsGroupStyles = css({
  padding: spacing[200],
});

export type JSONEditorProps = {
  namespace: string;
  doc: Document;
  editable: boolean;
  isTimeSeries?: boolean;
  removeDocument?: CrudActions['removeDocument'];
  replaceDocument?: CrudActions['replaceDocument'];
  updateDocument?: CrudActions['updateDocument'];
  copyToClipboard?: CrudActions['copyToClipboard'];
  openInsertDocumentDialog?: CrudActions['openInsertDocumentDialog'];
};

const JSONEditor: React.FunctionComponent<JSONEditorProps> = ({
  namespace,
  doc,
  editable,
  isTimeSeries = false,
  removeDocument,
  replaceDocument,
  copyToClipboard,
  openInsertDocumentDialog,
}) => {
  const darkMode = useDarkMode();
  const editorRef = useRef<EditorRef>(null);
  const [expanded, setExpanded] = useState<boolean>(doc.expanded);
  const [editing, setEditing] = useState<boolean>(doc.editing);
  const [deleting, setDeleting] = useState<boolean>(doc.markedForDeletion);
  const [value, setValue] = useState<string>(
    () => doc.modifiedEJSONString ?? doc.toEJSON()
  );
  const [initialValue] = useState<string>(() => doc.toEJSON());
  const [containsErrors, setContainsErrors] = useState<boolean>(false);
  const setModifiedEJSONStringRef = useRef<(value: string | null) => void>(
    doc.setModifiedEJSONString.bind(doc)
  );
  setModifiedEJSONStringRef.current = doc.setModifiedEJSONString.bind(doc);

  useEffect(() => {
    const setModifiedEJSONString = setModifiedEJSONStringRef.current;
    return () => {
      // When this component is used in virtualized list, the editor is
      // unmounted on scroll and if the user is editing the document, the
      // editor value is lost. This is a way to keep track of the editor
      // value when the it's unmounted and is restored on next mount.
      setModifiedEJSONString(editing ? value : null);
    };
  }, [value, editing]);

  const handleCopy = useCallback(() => {
    copyToClipboard?.(doc);
  }, [copyToClipboard, doc]);

  const handleClone = useCallback(() => {
    const clonedDoc = doc.generateObject({
      excludeInternalFields: true,
    });
    openInsertDocumentDialog?.(clonedDoc, true);
  }, [doc, openInsertDocumentDialog]);

  const onChange = useCallback((value: string) => {
    let containsErrors = false;
    try {
      JSON.parse(value);
    } catch {
      containsErrors = true;
    }
    setContainsErrors(containsErrors);
    setValue(value);
  }, []);

  const onCancel = useCallback(() => {
    if (editing) {
      doc.finishEditing();
    } else if (deleting) {
      doc.finishDeletion();
    }
    setValue(doc.toEJSON());
  }, [doc, editing, deleting]);

  const onEdit = useCallback(() => {
    doc.startEditing();
  }, [doc]);

  const onEditingStarted = useCallback(() => {
    setEditing(true);
  }, []);

  const onUpdate = useCallback(() => {
    doc.apply(HadronDocument.FromEJSON(value || ''));
    replaceDocument?.(doc);
  }, [doc, replaceDocument, value]);

  const onEditingFinished = useCallback(() => {
    setEditing(false);
  }, []);

  const onMarkForDeletion = useCallback(() => {
    doc.markForDeletion();
  }, [doc]);

  const onDeletionStarted = useCallback(() => {
    setDeleting(true);
  }, []);

  const onDelete = useCallback(() => {
    removeDocument?.(doc);
  }, [doc, removeDocument]);

  const onDeletionFinished = useCallback(() => {
    setDeleting(false);
  }, []);

  const onExpanded = useCallback(() => {
    setExpanded(true);
  }, []);

  const onCollapsed = useCallback(() => {
    setExpanded(false);
  }, []);

  const fields = useAutocompleteFields(namespace);

  const completer = useMemo(() => {
    return createDocumentAutocompleter(
      fields.map((field) => {
        return field.name;
      })
    );
  }, [fields]);

  const isEditable = editable && !deleting && !isTimeSeries;

  const actions = useMemo<Action[]>(() => {
    if (editing) {
      return [];
    }

    return [
      isEditable && {
        icon: 'Edit',
        label: 'Edit',
        action() {
          onEdit();
        },
      },
      {
        icon: 'Copy',
        label: 'Copy',
        action() {
          handleCopy();
          return true;
        },
      },
      isEditable && {
        icon: 'Clone',
        label: 'Clone',
        action: handleClone,
      },
      isEditable && {
        icon: 'Trash',
        label: 'Delete',
        action() {
          onMarkForDeletion();
        },
      },
    ].filter(Boolean) as Action[];
  }, [editing, onEdit, onMarkForDeletion, handleClone, handleCopy, isEditable]);

  useEffect(() => {
    doc.on(HadronDocument.Events.Cancel, onCancel);
    doc.on(HadronDocument.Events.Expanded, onExpanded);
    doc.on(HadronDocument.Events.Collapsed, onCollapsed);
    doc.on(HadronDocument.Events.EditingStarted, onEditingStarted);
    doc.on(HadronDocument.Events.EditingFinished, onEditingFinished);
    doc.on(HadronDocument.Events.MarkedForDeletion, onDeletionStarted);
    doc.on(HadronDocument.Events.DeletionFinished, onDeletionFinished);

    return () => {
      doc.removeListener(HadronDocument.Events.Cancel, onCancel);
      doc.removeListener(HadronDocument.Events.Expanded, onExpanded);
      doc.removeListener(HadronDocument.Events.Collapsed, onCollapsed);
      doc.removeListener(
        HadronDocument.Events.EditingStarted,
        onEditingStarted
      );
      doc.removeListener(
        HadronDocument.Events.EditingFinished,
        onEditingFinished
      );
      doc.removeListener(
        HadronDocument.Events.MarkedForDeletion,
        onDeletionStarted
      );
      doc.removeListener(
        HadronDocument.Events.DeletionFinished,
        onDeletionFinished
      );
    };
  }, [
    doc,
    onCancel,
    onExpanded,
    onCollapsed,
    onEditingStarted,
    onEditingFinished,
    onDeletionStarted,
    onDeletionFinished,
  ]);

  const toggleExpandCollapse = useCallback(() => {
    if (doc.expanded) {
      doc.collapse();
    } else {
      doc.expand();
    }
  }, [doc]);

  // Trying to change CodeMirror editor state when an update "effect" is in
  // progress results in an error which is why we timeout the code mirror update
  // itself.
  const editorFoldUnfoldTimeoutRef = useRef<NodeJS.Timeout | undefined>();
  useEffect(() => {
    if (editorFoldUnfoldTimeoutRef.current) {
      clearTimeout(editorFoldUnfoldTimeoutRef.current);
    }

    editorFoldUnfoldTimeoutRef.current = setTimeout(() => {
      if (!editorRef.current) {
        return;
      }

      if (expanded) {
        editorRef.current.unfoldAll();
      } else {
        editorRef.current.foldAll();
      }
    }, 0);
  }, [expanded]);

  return (
    <div data-testid="editable-json">
      <CodemirrorMultilineEditor
        ref={editorRef}
        language="json"
        text={value}
        onChangeText={onChange}
        // Document list card uses its own custom actions
        copyable={false}
        formattable={false}
        customActions={actions}
        minLines={3}
        readOnly={!editing}
        showLineNumbers={editing}
        className={cx(editorStyles, darkMode && editorDarkModeStyles)}
        actionsClassName={actionsGroupStyles}
        completer={completer}
        onExpand={editing ? undefined : toggleExpandCollapse}
        expanded={expanded}
      />
      <DocumentList.DocumentEditActionsFooter
        doc={doc}
        alwaysForceUpdate
        editing={!!editing}
        deleting={!!deleting}
        modified={value !== initialValue}
        containsErrors={containsErrors}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onCancel={onCancel}
      />
    </div>
  );
};

export default JSONEditor;

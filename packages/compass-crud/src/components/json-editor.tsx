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
  paddingTop: spacing[2],
  paddingRight: spacing[2],
});

export type JSONEditorProps = {
  doc: Document;
  editable: boolean;
  isTimeSeries?: boolean;
  removeDocument?: CrudActions['removeDocument'];
  replaceDocument?: CrudActions['replaceDocument'];
  updateDocument?: CrudActions['updateDocument'];
  copyToClipboard?: CrudActions['copyToClipboard'];
  openInsertDocumentDialog?: CrudActions['openInsertDocumentDialog'];
  isExpanded?: boolean;
  fields?: string[];
};

const JSONEditor: React.FunctionComponent<JSONEditorProps> = ({
  doc,
  editable,
  isTimeSeries = false,
  removeDocument,
  replaceDocument,
  copyToClipboard,
  openInsertDocumentDialog,
  isExpanded = false,
  fields = [],
}) => {
  const darkMode = useDarkMode();
  const editorRef = useRef<EditorRef>(null);
  const [editing, setEditing] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [value, setValue] = useState<string>(() => doc.toEJSON());
  const [initialValue] = useState<string>(() => doc.toEJSON());
  const [containsErrors, setContainsErrors] = useState<boolean>(false);

  const handleUpdateSuccess = useCallback(() => {
    if (editing) {
      setTimeout(() => {
        setEditing(false);
      }, 500);
    }
  }, [editing]);

  const handleRemoveSuccess = useCallback(() => {
    if (deleting) {
      setTimeout(() => {
        setDeleting(false);
      }, 500);
    }
  }, [deleting]);

  useEffect(() => {
    doc.on('remove-success', handleRemoveSuccess);
    doc.on('update-success', handleUpdateSuccess);

    return () => {
      doc.removeListener('remove-success', handleRemoveSuccess);
      doc.removeListener('update-success', handleUpdateSuccess);
    };
  }, [doc, handleRemoveSuccess, handleUpdateSuccess]);

  const handleCopy = useCallback(() => {
    copyToClipboard?.(doc);
  }, [copyToClipboard, doc]);

  const handleClone = useCallback(() => {
    const clonedDoc = doc.generateObject({
      excludeInternalFields: true,
    });
    openInsertDocumentDialog?.(clonedDoc, true);
  }, [doc, openInsertDocumentDialog]);

  const onCancel = useCallback(() => {
    setEditing(false);
    setDeleting(false);
    setValue(doc.toEJSON());
  }, [doc]);

  const onUpdate = useCallback(() => {
    doc.apply(HadronDocument.FromEJSON(value || ''));
    replaceDocument?.(doc);
  }, [doc, replaceDocument, value]);

  const onDelete = useCallback(() => {
    removeDocument?.(doc);
  }, [doc, removeDocument]);

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

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    if (isExpanded) {
      editorRef.current.unfoldAll();
    } else {
      editorRef.current.foldAll();
    }
  }, [isExpanded]);

  const completer = useMemo(() => {
    return createDocumentAutocompleter(fields);
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
          setEditing(true);
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
          setDeleting(true);
        },
      },
    ].filter(Boolean) as Action[];
  }, [editing, handleClone, handleCopy, isEditable]);

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

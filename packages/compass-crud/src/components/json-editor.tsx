import React, { useCallback, useEffect, useState, useRef } from 'react';
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

import { JSONEditor as Editor } from '@mongodb-js/compass-editor';
import type { EditorView } from '@mongodb-js/compass-editor';
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
    backgroundColor: `${palette.gray.dark3} !important`,
  },
  '& .cm-gutters': {
    backgroundColor: `${palette.gray.dark3} !important`,
  },
});

export type JsonEditorProps = {
  doc: Document;
  editable: boolean;
  isTimeSeries: boolean;
  removeDocument?: CrudActions['removeDocument'];
  replaceDocument?: CrudActions['replaceDocument'];
  updateDocument?: CrudActions['updateDocument'];
  copyToClipboard?: CrudActions['copyToClipboard'];
  openInsertDocumentDialog?: CrudActions['openInsertDocumentDialog'];
  isExpanded: boolean;
};

const JSONEditor: React.FunctionComponent<JsonEditorProps> = ({
  doc,
  editable,
  isTimeSeries,
  removeDocument,
  replaceDocument,
  copyToClipboard,
  openInsertDocumentDialog,
  isExpanded,
}) => {
  const darkMode = useDarkMode();
  const editorRef = useRef<EditorView>();
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
      Editor.unfoldAll(editorRef.current);
    } else {
      Editor.foldAll(editorRef.current);
    }
  }, [isExpanded]);

  const isEditable = editable && !deleting && !isTimeSeries;

  return (
    <div data-testid="editable-json">
      <Editor
        text={value}
        onChangeText={onChange}
        readOnly={!editing}
        showLineNumbers={editing}
        className={cx(editorStyles, darkMode && editorDarkModeStyles)}
        onLoad={(editor) => {
          editorRef.current = editor;
        }}
      />
      {!editing && (
        <DocumentList.DocumentActionsGroup
          onEdit={
            isEditable
              ? () => {
                  setEditing(true);
                }
              : undefined
          }
          onCopy={handleCopy}
          onRemove={
            isEditable
              ? () => {
                  setDeleting(true);
                }
              : undefined
          }
          onClone={isEditable ? handleClone : undefined}
        />
      )}
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

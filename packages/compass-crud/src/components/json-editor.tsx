import React, { useCallback, useEffect, useState } from 'react';
import { css, cx, DocumentList, spacing } from '@mongodb-js/compass-components';
import type { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';

import { JSONEditor as Editor } from '@mongodb-js/compass-editor';
import type { CrudActions } from '../stores/crud-store';

const editorStyles = css({
  minHeight: spacing[5] + spacing[3],
  // Special case only for this view that doesn't make sense to make part of
  // the editor component
  '& .cm-editor': {
    background: 'none !important',
  },
  '& .cm-gutters': {
    background: 'none !important',
  },
});

const editorReadonlyStyles = css({
  '& .cm-lineNumbers': {
    // We want to hide the line number but keep the spacing and the active line
    // highlight, the easiest way to do it is to make the text color transparent
    color: 'transparent !important',
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
  openInsertDocumentDialog,
  copyToClipboard,
}) => {
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

  const isEditable = editable && !deleting && !isTimeSeries;

  return (
    <div data-testid="editable-json">
      <Editor
        text={value}
        onChangeText={onChange}
        readOnly={!editing}
        className={cx(editorStyles, !editing && editorReadonlyStyles)}
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

JSONEditor.displayName = 'JSONEditor';

export default JSONEditor;

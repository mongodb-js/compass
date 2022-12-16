import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  css,
  cx,
  DocumentList,
  fontFamilies,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { Document } from 'hadron-document';
import HadronDocument from 'hadron-document';

import { Editor, EditorVariant } from '@mongodb-js/compass-editor';
import type { CrudActions } from '../stores/crud-store';

import hljs from 'highlight.js/lib/core'; // Skip highlight's auto-registering
import json from 'highlight.js/lib/languages/json';

hljs.registerLanguage('json', json);

type ReadOnlyJsonCodeProps = {
  className?: string;
  code: string;
};

const codeStyle = css({
  fontFamily: fontFamilies.code,
  fontSize: '13px',
  fontWeight: 400,
  lineHeight: '16px',
  whiteSpace: 'pre',
  padding: spacing[3],
  margin: 0,
  overflow: 'auto',
  '& .hljs-string': { color: palette.blue.base },
  '& .hljs-literal': { color: palette.blue.base },
  '& .hljs-number': { color: palette.blue.base },
  '& .hljs-keyword': { color: palette.blue.base, fontWeight: 'bold' },
});

const ReadOnlyJsonCode: React.FunctionComponent<
  ReadOnlyJsonCodeProps & React.HTMLAttributes<HTMLPreElement>
> = ({ className, code, ...rest }) => {
  const highlightedContent: string = useMemo(() => {
    const { value } = hljs.highlight(code, {
      language: 'json',
      ignoreIllegals: true,
    });

    const lines = value.split('\n');

    return lines.map((line) => `<code>${line}</code>`).join('\n');
  }, [code]);

  return (
    <pre
      {...rest}
      className={cx(className, codeStyle)}
      dangerouslySetInnerHTML={{ __html: highlightedContent }}
    ></pre>
  );
};

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
  const [value, setValue] = useState<string>('');
  const [initialValue, setInitialValue] = useState<string>('');
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
    const text = doc.toEJSON();
    setValue(text);
    setInitialValue(text);

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
      {editing ? (
        <div className="json-ace-editor">
          <Editor
            copyable={false}
            formattable={false}
            variant={EditorVariant.EJSON}
            text={value}
            onChangeText={onChange}
            options={{
              minLines: 2,
              highlightActiveLine: false,
              highlightGutterLine: false,
              showLineNumbers: true,
              fixedWidthGutter: false,
              displayIndentGuides: false,
              wrapBehavioursEnabled: true,
              foldStyle: 'markbegin',
            }}
          />
        </div>
      ) : (
        <>
          <DocumentList.DocumentActionsGroup
            onEdit={isEditable ? () => setEditing(true) : undefined}
            onCopy={handleCopy}
            onRemove={isEditable ? () => setDeleting(true) : undefined}
            onClone={isEditable ? handleClone : undefined}
          />
          <ReadOnlyJsonCode
            code={value}
            onDoubleClick={isEditable ? () => setEditing(true) : undefined}
          ></ReadOnlyJsonCode>
        </>
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

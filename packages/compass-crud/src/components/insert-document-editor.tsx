import React from 'react';
import {
  css,
  cx,
  palette,
  useDarkMode,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type { EditorRef } from '@mongodb-js/compass-editor';
import { useJsonEditorAnnotations } from '../utils/use-json-editor-annotations';

const editorContainerStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

type InsertDocumentEditorProps = {
  darkMode?: boolean;
  editorText: string;
  updateInsertDocText: (value: string) => void;
  error: Error | null;
  editorRef: React.RefObject<EditorRef>;
  shellSyntax?: boolean;
};

const InsertDocumentEditor: React.FunctionComponent<
  InsertDocumentEditorProps
> = ({ error, editorText, updateInsertDocText, editorRef, shellSyntax }) => {
  const darkMode = useDarkMode();
  const annotations = useJsonEditorAnnotations({ error });
  return (
    <div
      className={cx(
        darkMode ? editorContainerStylesDark : editorContainerStylesLight
      )}
    >
      <CodemirrorMultilineEditor
        data-testid="insert-document-editor"
        language={shellSyntax ? 'javascript-expression' : 'json'}
        text={editorText}
        onChangeText={updateInsertDocText}
        initialJSONFoldAll={false}
        minLines={18}
        annotations={annotations}
        ref={editorRef}
      />
    </div>
  );
};

export default withDarkMode(InsertDocumentEditor);

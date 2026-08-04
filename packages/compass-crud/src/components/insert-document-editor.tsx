import React from 'react';
import {
  css,
  cx,
  palette,
  useDarkMode,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type { EditorRef, Extension } from '@mongodb-js/compass-editor';

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
  safeIntegerLinter: Extension;
  editorRef: React.RefObject<EditorRef>;
  shellSyntax?: boolean;
};

const InsertDocumentEditor: React.FunctionComponent<
  InsertDocumentEditorProps
> = ({
  editorText,
  updateInsertDocText,
  editorRef,
  shellSyntax,
  safeIntegerLinter,
}) => {
  const darkMode = useDarkMode();
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
        linter={safeIntegerLinter}
        ref={editorRef}
      />
    </div>
  );
};

export default withDarkMode(InsertDocumentEditor);

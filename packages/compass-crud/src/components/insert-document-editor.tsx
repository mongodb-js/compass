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
import { useDocumentAutocompleter } from '../hooks/use-document-autocompleter';

const editorContainerStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const MIN_LINES = 12;
// The editor's default line height.
const LINE_HEIGHT = 16;
export const INSERT_EDITOR_MIN_HEIGHT = MIN_LINES * LINE_HEIGHT;

type InsertDocumentEditorProps = {
  darkMode?: boolean;
  editorText: string;
  updateInsertDocText: (value: string) => void;
  safeIntegerLinter: Extension;
  editorRef: React.RefObject<EditorRef>;
  shellSyntax?: boolean;
  namespace: string;
};

const InsertDocumentEditor: React.FunctionComponent<
  InsertDocumentEditorProps
> = ({
  editorText,
  updateInsertDocText,
  editorRef,
  shellSyntax,
  safeIntegerLinter,
  namespace,
}) => {
  const darkMode = useDarkMode();
  const completer = useDocumentAutocompleter(namespace);
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
        minLines={MIN_LINES}
        linter={safeIntegerLinter}
        completer={completer}
        ref={editorRef}
      />
    </div>
  );
};

export default withDarkMode(InsertDocumentEditor);

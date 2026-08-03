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

type InsertJsonDocumentProps = {
  darkMode?: boolean;
  jsonDoc: string;
  updateJsonDoc: (value: string) => void;
  error: Error | null;
  editorRef: React.RefObject<EditorRef>;
};

const InsertJsonDocument: React.FunctionComponent<InsertJsonDocumentProps> = ({
  error,
  jsonDoc,
  updateJsonDoc,
  editorRef,
}) => {
  const darkMode = useDarkMode();
  const annotations = useJsonEditorAnnotations({ error });
  return (
    <div
      className={cx(
        darkMode ? editorContainerStylesDark : editorContainerStylesLight
      )}
    >
      <CodemirrorMultilineEditor
        data-testid="insert-document-json-editor"
        language="json"
        text={jsonDoc}
        onChangeText={updateJsonDoc}
        initialJSONFoldAll={false}
        minLines={18}
        annotations={annotations}
        ref={editorRef}
      />
    </div>
  );
};

export default withDarkMode(InsertJsonDocument);

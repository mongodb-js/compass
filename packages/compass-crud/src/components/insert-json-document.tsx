import React from 'react';
import {
  css,
  cx,
  palette,
  useDarkMode,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type { Annotation, EditorRef } from '@mongodb-js/compass-editor';

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
  annotations: Annotation[];
  editorRef: React.RefObject<EditorRef>;
};

const InsertJsonDocument: React.FunctionComponent<InsertJsonDocumentProps> = ({
  annotations,
  jsonDoc,
  updateJsonDoc,
  editorRef,
}) => {
  const darkMode = useDarkMode();
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

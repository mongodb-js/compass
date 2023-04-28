import React, { useState } from 'react';
import { css, cx, palette, withDarkMode } from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

const minEditorHeight = 280;

const editorContainerStyles = css({
  padding: '10px 10px 10px 0',
  height: `${minEditorHeight + 20}px`,
  overflow: 'auto',
  flexBasis: 'auto',
  flexShrink: 1,
  flexGrow: 1,
});

const editorContainerStylesLight = css({
  backgroundColor: palette.gray.light3,
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  backgroundColor: palette.gray.dark4,
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const editorStyles = css({
  minHeight: `${minEditorHeight}px`,
});

/**
 * The comment block.
 */
const EDITOR_COMMENT = '/** \n* Paste one or more documents here\n*/\n';

type InsertJsonDocumentProps = {
  darkMode?: boolean;
  jsonDoc: string;
  isCommentNeeded: boolean;
  updateComment: (value: boolean) => void;
  updateJsonDoc: (value: string) => void;
};

const InsertJsonDocument: React.FunctionComponent<InsertJsonDocumentProps> = ({
  darkMode,
  jsonDoc,
  isCommentNeeded,
  updateJsonDoc,
}) => {
  const [text, setText] = useState(() => {
    return isCommentNeeded ? `${EDITOR_COMMENT}${jsonDoc}` : jsonDoc;
  });

  const onChangeText = (value: string) => {
    setText(value);
    updateJsonDoc(value.split('*/\n').pop() ?? '');
  };

  return (
    <div
      className={cx(
        editorContainerStyles,
        darkMode ? editorContainerStylesDark : editorContainerStylesLight
      )}
    >
      <CodemirrorMultilineEditor
        data-testid="insert-document-json-editor"
        language="json"
        className={editorStyles}
        text={text}
        onChangeText={onChangeText}
        initialJSONFoldAll={false}
      />
    </div>
  );
};

export default withDarkMode(InsertJsonDocument);

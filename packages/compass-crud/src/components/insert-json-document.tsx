import React, { useState } from 'react';
import { css, cx, palette, withDarkMode } from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

const editorContainerStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
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
        darkMode ? editorContainerStylesDark : editorContainerStylesLight
      )}
    >
      <CodemirrorMultilineEditor
        data-testid="insert-document-json-editor"
        language="json"
        text={text}
        onChangeText={onChangeText}
        initialJSONFoldAll={false}
        minLines={18}
      />
    </div>
  );
};

export default withDarkMode(InsertJsonDocument);

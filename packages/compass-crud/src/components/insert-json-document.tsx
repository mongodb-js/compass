import React, { useState } from 'react';
import {
  Checkbox,
  css,
  cx,
  palette,
  spacing,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';

const editorContainerStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const checkboxStyles = css({
  marginTop: spacing[3],
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

function blankLeafValues(jsonDoc: string) {
  return (
    jsonDoc
      // strings
      .replace(/: "[^"]+"/g, ': ""')
      // numbers
      .replace(/: -?\d+(\.\d+)?/g, ': ')
      // booleans
      .replace(/: (true|false)/g, ': ')
  );
}

function getInitialText(jsonDoc: string, isCommentNeeded: boolean) {
  return isCommentNeeded ? `${EDITOR_COMMENT}${jsonDoc}` : jsonDoc;
}

const InsertJsonDocument: React.FunctionComponent<InsertJsonDocumentProps> = ({
  darkMode,
  jsonDoc,
  isCommentNeeded,
  updateJsonDoc,
}) => {
  const [text, setText] = useState(() => {
    return getInitialText(jsonDoc, isCommentNeeded);
  });

  const [isBlank, setIsBlank] = useState(false);
  const [blankText, setBlankText] = useState(() => {
    return blankLeafValues(getInitialText(jsonDoc, isCommentNeeded));
  });
  const [isChanged, setIsChanged] = useState(false);

  const onChangeText = (value: string) => {
    updateJsonDoc(value.split('*/\n').pop() ?? '');

    // Don't disable the With Field Values checkbox unless the user changed the
    // text.
    if (value === blankText || value === text) {
      return;
    }

    setIsChanged(true);
    setText(value);
  };

  const onChangeBlank = () => {
    if (isBlank) {
      setIsBlank(false);
    } else {
      setBlankText(blankLeafValues(text));
      setIsBlank(true);
    }
  };

  const isDisabled = isChanged;

  return (
    <div>
      <div
        className={cx(
          darkMode ? editorContainerStylesDark : editorContainerStylesLight
        )}
      >
        <CodemirrorMultilineEditor
          data-testid="insert-document-json-editor"
          language="json"
          text={isBlank ? blankText : text}
          onChangeText={onChangeText}
          initialJSONFoldAll={false}
          minLines={18}
        />
      </div>
      <Checkbox
        className={checkboxStyles}
        data-testid="with-field-values"
        onChange={onChangeBlank}
        label="With Field Values"
        checked={!isBlank || isDisabled}
        disabled={isDisabled}
        bold={false}
      />
    </div>
  );
};

export default withDarkMode(InsertJsonDocument);

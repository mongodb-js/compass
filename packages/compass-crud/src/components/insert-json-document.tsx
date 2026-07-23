import React, { useMemo } from 'react';
import {
  css,
  cx,
  palette,
  spacing,
  useDarkMode,
  withDarkMode,
} from '@mongodb-js/compass-components';
import { CodemirrorMultilineEditor } from '@mongodb-js/compass-editor';
import type {
  Annotation,
  EditorRef,
  EditorView,
} from '@mongodb-js/compass-editor';
import { UnsafeIntegerValidationError } from 'hadron-document';

const editorContainerStylesLight = css({
  borderLeft: `3px solid ${palette.gray.light2}`,
});

const editorContainerStylesDark = css({
  borderLeft: `3px solid ${palette.gray.dark2}`,
});

const actionMessageStyles = css({
  display: 'inline',
  marginRight: spacing[200],
});

const actionButtonStyles = css({
  background: 'none',
  border: 'none',
  color: palette.blue.base,
  padding: 0,
  '&:hover': {
    cursor: 'pointer',
  },
});

const actionButtonDarkStyles = css({
  color: palette.blue.light1,
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

  const annotations: Annotation[] = useMemo(() => {
    if (error instanceof UnsafeIntegerValidationError) {
      return error.violations.map((violation) => ({
        message: 'Exceeds safe integer range.',
        from: violation.loc.from,
        to: violation.loc.to,
        severity: 'error',
        renderMessage: (view: EditorView) => {
          const container = document.createElement('div');
          const text = document.createElement('div');
          text.className = actionMessageStyles;
          text.textContent =
            'Exceeds safe integer range. Wrap it as {"$numberLong": "..."} to preserve its exact value.';
          container.appendChild(text);

          const button = document.createElement('button');
          button.type = 'button';
          button.className = cx(
            actionButtonStyles,
            darkMode && actionButtonDarkStyles
          );
          button.textContent = 'Convert to Int64';
          button.addEventListener('click', () => {
            view.dispatch({
              changes: [
                {
                  from: violation.loc.from,
                  to: violation.loc.to,
                  insert: `{"$numberLong": "${violation.source}"}`,
                },
              ],
            });
          });
          container.appendChild(button);

          return container;
        },
      }));
    }
    return [];
  }, [error, darkMode]);

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

import { useMemo } from 'react';
import {
  useDarkMode,
  cx,
  css,
  palette,
  spacing,
} from '@mongodb-js/compass-components';
import type { Annotation, EditorView } from '@mongodb-js/compass-editor';
import { UnsafeIntegerValidationError } from 'hadron-document';

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

export function useJsonEditorAnnotations({
  error,
}: {
  error: Error | null;
}): Annotation[] {
  const darkmode = useDarkMode();
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
            darkmode && actionButtonDarkStyles
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
  }, [error, darkmode]);
  return annotations;
}

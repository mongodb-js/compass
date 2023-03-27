import React from 'react';
import { css, cx } from '@mongodb-js/compass-components';
import { BaseEditor } from './json-editor';

// Similar to inline editor, the idea for syntax highlight component is to be
// easily integrated in other parts of the UI and so all the default paddings
// and backgrounds are removed from the editor styles
const syntaxHighlightStyles = css({
  '& .cm-editor': {
    backgroundColor: 'transparent',
  },
  '& .cm-line': {
    // leaving 1px for the bracket select outline (otherwise it can be cut off
    // by the editor container)
    paddingLeft: 1,
    paddingRight: 1,
  },
  '& .cm-content': {
    padding: 0,
  },
});

/**
 * Renders a readonly editor with a limited interface, useful for syntax
 * highlighting
 */
export const SyntaxHighlight: React.FunctionComponent<
  Omit<
    React.ComponentProps<typeof BaseEditor>,
    | 'onChangeText'
    | 'onLoad'
    | 'highlightActiveLine'
    | 'readOnly'
    | 'completer'
    | 'commands'
    | 'placeholder'
  > &
    (
      | { text: string; initialText?: never }
      | { text?: never; initialText: string }
    )
> = ({ className, ...props }) => {
  return (
    <BaseEditor
      {...props}
      className={cx(syntaxHighlightStyles, className)}
      readOnly
    ></BaseEditor>
  );
};

import { css, cx } from '@mongodb-js/compass-components';
import React from 'react';
import {
  // TODO: the import name will change https://jira.mongodb.org/browse/COMPASS-6481
  JSONEditor as BaseEditor,
} from './json-editor';

// Similar to inline editor, the idea for syntax highlight component is to be
// easily integrated in other parts of the UI and so all the default paddings
// and backgrounds are removed from the editor styles
//
// TODO: This should actually be part of the inline component when we will have
// one that is codemirror based. For now we will keep these styles here
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
  Pick<
    React.ComponentProps<typeof BaseEditor>,
    'language' | 'showLineNumbers' | 'showFoldGutter' | 'className'
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

import type { EditorView } from '@codemirror/view';

export type CompletionWithServerInfo = {
  name?: string;
  value?: string;
  type?: string | undefined;
  /** Code snippet inserted when completion is selected */
  snippet?: string;
  exactMatch?: number | undefined;
  docHTML?: string | undefined;
} & {
  /** Server version that supports the stage */
  version: string;
  /* Server version that supports using the key in $project stage */
  projectVersion?: string;
  /** Optional completion description */
  description?: string;
};

export type EditorRef = {
  foldAll: () => boolean;
  unfoldAll: () => boolean;
  copyAll: () => boolean;
  prettify: () => boolean;
  applySnippet: (template: string) => boolean;
  focus: () => boolean;
  cursorDocEnd: () => boolean;
  startCompletion: () => boolean;
  readonly editorContents: string | null;
  readonly editor: EditorView | null;
};

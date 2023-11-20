import { forceParsing } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import type {
  CompletionSource,
  CompletionResult,
} from '@codemirror/autocomplete';
import { CompletionContext } from '@codemirror/autocomplete';
import { languages } from '../src/editor';

export const setupCodemirrorCompleter = <
  T extends (...args: any[]) => CompletionSource
>(
  completer: T
) => {
  let el: HTMLDivElement;
  let editor: EditorView;
  before(function () {
    el = window.document.createElement('div');
    window.document.body.appendChild(el);
    editor = new EditorView({
      doc: '',
      extensions: [languages['javascript-expression']()],
      parent: el,
    });
  });
  const getCompletions = (text = '', ...args: Parameters<T>) => {
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: text },
      selection: { anchor: text.length },
      userEvent: 'input.type',
    });
    forceParsing(editor, editor.state.doc.length, 10_000);
    return (
      (
        completer(...args)(
          new CompletionContext(editor.state, text.length, false)
        ) as CompletionResult
      )?.options ?? []
    );
  };
  const cleanup = () => {
    editor.destroy();
    el.remove();
  };
  const applySnippet = (completion: any) => {
    completion.apply(editor, null, 0, editor.state.doc.length);
    return editor.state.sliceDoc(0);
  };
  return { getCompletions, cleanup, applySnippet };
};

import { forceParsing } from '@codemirror/language';
import { forceLinting } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { languages } from '../src/editor';

export const setupCodemirrorLinter = (linter: Extension) => {
  let el: HTMLDivElement;
  let editor: EditorView;
  before(function () {
    el = window.document.createElement('div');
    window.document.body.appendChild(el);
    editor = new EditorView({
      doc: '',
      extensions: [languages['javascript-expression'](), linter],
      parent: el,
    });
  });

  after(function () {
    editor.destroy();
    el.remove();
  });

  return (text: string) => {
    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: text },
      selection: { anchor: text.length },
      userEvent: 'input.type',
    });
    forceParsing(editor, editor.state.doc.length, 10_000);
    forceLinting(editor);
  };
};

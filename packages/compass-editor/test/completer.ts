// Order is important! ace-builds should stay on top
import { EditSession } from 'ace-builds';
import type { Ace } from 'ace-builds';
import { Mode } from 'ace-builds/src-noconflict/mode-javascript';
import { forceParsing } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import type {
  CompletionSource,
  CompletionResult,
} from '@codemirror/autocomplete';
import { CompletionContext } from '@codemirror/autocomplete';
import { languages } from '../src/json-editor';
import type { CompletionWithServerInfo } from '../src';
import { EditorTextCompleter } from '../src';

type CompletionsOptions = {
  serverVersion: string;
  fields: Partial<CompletionWithServerInfo>[];
  pos: Ace.Position;
  stageOperator: string | null;
};

export function getDefaultPos(text: string): Ace.Position {
  const lines = text.split('\n');
  return { row: lines.length - 1, column: lines[lines.length - 1].length };
}

export function setupCompleter<T extends Ace.Completer>(
  Completer: new (...args: any[]) => T,
  text: string,
  options: Partial<CompletionsOptions> = {}
): {
  completer: T;
  getCompletions: (callback: Ace.CompleterCallback) => void;
} {
  const {
    serverVersion = '999.999.999',
    fields = [],
    pos = getDefaultPos(text),
    stageOperator = null,
  } = options;
  const completer = new Completer(
    serverVersion,
    EditorTextCompleter,
    fields,
    stageOperator
  );
  const session = new EditSession(text, new Mode() as Ace.SyntaxMode);
  const getCompletions = (callback: Ace.CompleterCallback) => {
    const token = session.getTokenAt(pos.row, pos.column);
    completer.getCompletions(
      {} as Ace.Editor,
      session,
      pos,
      token?.value.replace(/(^["']|["']$)/g, '') ?? '',
      callback
    );
  };
  return { completer, getCompletions };
}

export const setupCodemirrorCompleter = <
  T extends (...args: any[]) => CompletionSource
>(
  completer: T
) => {
  const el = window.document.createElement('div');
  window.document.body.appendChild(el);
  const editor = new EditorView({
    doc: '',
    extensions: [languages.javascript()],
    parent: el,
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

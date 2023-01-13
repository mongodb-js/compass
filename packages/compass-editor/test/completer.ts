// Order is important! ace-builds should stay on top
import { EditSession } from 'ace-builds';
import type { Ace } from 'ace-builds';
import { Mode } from 'ace-builds/src-noconflict/mode-javascript';
import type { CompletionWithServerInfo } from '../src';
import { EditorTextCompleter } from '../src';

type CompletionsOptions = {
  serverVersion: string;
  fields: CompletionWithServerInfo[];
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

import {
  STAGE_OPERATORS as _STAGE_OPERATORS,
  STAGE_OPERATOR_NAMES,
} from '@mongodb-js/mongodb-constants';
import type { Ace } from 'ace-builds';
import type { CompletionWithServerInfo } from '../types';
import { StageAutoCompleter } from './stage-autocompleter';
import { filter } from './util';

const STAGE_OPERATORS = _STAGE_OPERATORS.map((op) => {
  return {
    ...op,
    snippet: `\\${op.name}: ${op.snippet}`,
  };
});

function type(token: Ace.Token, type: string) {
  return token.type.split('.').includes(type);
}

function getPreviousTokenPos(
  session: Ace.EditSession,
  row: number,
  token: Ace.Token | null
): { row: number; column: number } {
  if (token?.start === 0) {
    return {
      row: row - 1,
      column: (session as unknown as { $rowLengthCache: number[] })
        .$rowLengthCache[row - 1],
    };
  } else {
    return {
      row,
      column: token?.start ?? 0,
    };
  }
}

export function* getScopeTokensBefore(
  session: Ace.EditSession,
  pos: Ace.Position
) {
  let token = session.getTokenAt(pos.row, pos.column);
  let { row, column } = getPreviousTokenPos(session, pos.row, token);
  let skip = 0;
  while (row + column > 0) {
    token = session.getTokenAt(row, column);
    if (!token) {
      return;
    }
    // A very primitive scope tracker: we count opening and closing parens and
    // filter out everything from the sibling blocks that we run into. This can
    // be error-prone, but good enough for our purposes
    skip = Math.max(
      0,
      type(token, 'paren')
        ? skip +
            (type(token, 'rparen') ? 1 : -1) *
              // ace groups tokens with the same type, so one rparen can be
              // `{{{` so we change the stack accordingly
              token.value.length
        : skip
    );
    if (skip === 0) {
      yield token;
    }
    ({ row, column } = getPreviousTokenPos(session, row, token));
  }
}

/**
 * Adds autocomplete suggestions for queries.
 */
class AggregationAutoCompleter implements Ace.Completer {
  public stageAutocopmleter: StageAutoCompleter;
  constructor(
    public version: string,
    public textCompleter: Ace.Completer,
    public fields: CompletionWithServerInfo[]
  ) {
    this.stageAutocopmleter = new StageAutoCompleter(
      this.version,
      this.textCompleter,
      this.fields
    );
  }

  updateFields(fields: CompletionWithServerInfo[]) {
    this.fields = fields;
    this.stageAutocopmleter.update(fields, null);
  }

  getCompletions: Ace.Completer['getCompletions'] = (
    editor,
    session,
    position,
    prefix,
    callback
  ) => {
    const currentToken = session.getTokenAt(position.row, position.column);

    if (!currentToken) {
      return callback(null, []);
    }

    if (type(currentToken, 'comment')) {
      return callback(null, []);
    }

    for (const token of getScopeTokensBefore(session, position)) {
      if (
        // Quick check for cases where mongodb syntax mode is enabled
        type(token, 'stage_op') ||
        // Fallback when used with just javascript mode (for testing purposes mostly)
        (type(token, 'identifier') &&
          STAGE_OPERATOR_NAMES.includes(
            token.value as typeof STAGE_OPERATOR_NAMES[number]
          ))
      ) {
        this.stageAutocopmleter.updateStageOperator(token.value);
        return this.stageAutocopmleter.getCompletions(
          editor,
          session,
          position,
          prefix,
          callback
        );
      }
    }

    callback(null, filter(this.version, STAGE_OPERATORS, prefix));
  };
}

export { AggregationAutoCompleter };

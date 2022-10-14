import type { Ace } from 'ace-builds';
import type { CompletionWithServerInfo } from '../types';
import { filter, MATCH_COMPLETIONS } from './util';

/**
 * Adds autocomplete suggestions for queries.
 */
class QueryAutoCompleter implements Ace.Completer {
  constructor(
    public version: string,
    public textCompleter: Ace.Completer,
    public fields: CompletionWithServerInfo[]
  ) {}

  update(fields: CompletionWithServerInfo[]) {
    this.fields = fields;
  }

  getCompletions: Ace.Completer['getCompletions'] = (
    editor,
    session,
    position,
    prefix,
    done
  ) => {
    // Empty prefixes do not return results.
    if (prefix === '') return done(null, []);
    // If the current token is a string with single or double quotes, then
    // we want to use the local text completer instead of suggesting operators.
    // This is so we can suggest user variable names inside the pipeline that they
    // have already typed.
    const currentToken = session.getTokenAt(position.row, position.column);
    if (currentToken?.type === 'string') {
      return this.textCompleter.getCompletions(
        editor,
        session,
        position,
        prefix,
        done
      );
    }
    // If the current token is not a string, then we proceed as normal to suggest
    // operators to the user.
    const expressions = MATCH_COMPLETIONS.concat(this.fields);
    done(null, filter(this.version, expressions, prefix));
  };
}

export { QueryAutoCompleter };

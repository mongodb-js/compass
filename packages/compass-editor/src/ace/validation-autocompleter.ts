import type { Ace } from 'ace-builds';
import { completer } from '../autocompleter';
import type { CompletionWithServerInfo } from '../types';
import { getNames } from './util';

/**
 * Adds autocomplete suggestions for validation queries.
 */
class ValidationAutoCompleter implements Ace.Completer {
  constructor(
    public version: string,
    public textCompleter: Ace.Completer,
    public fields: CompletionWithServerInfo[]
  ) {
    this.version = version;
    this.textCompleter = textCompleter;
    this.fields = fields;
  }

  update(fields: CompletionWithServerInfo[]) {
    this.fields = fields;
  }

  getCompletions: Ace.Completer['getCompletions'] = (
    _editor,
    session,
    position,
    prefix,
    done
  ) => {
    // Empty prefixes do not return results.
    if (prefix === '') return done(null, []);
    // If the current token is a string with single or double quotes, then
    // we want to suggest document fields instead of suggesting operators.
    const currentToken = session.getTokenAt(position.row, position.column);
    if (currentToken?.type === 'string') {
      return done(
        null,
        completer(prefix, {
          serverVersion: this.version,
          fields: getNames(this.fields),
          meta: ['bson-type-aliases', 'field:identifier'],
        })
      );
    }
    // If the current token is not a string, then we proceed as normal to suggest
    // operators to the user.
    return done(
      null,
      completer(prefix, {
        serverVersion: this.version,
        meta: ['query', 'bson', 'json-schema'],
      })
    );
  };
}

export { ValidationAutoCompleter };

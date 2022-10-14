import { JSON_SCHEMA, BSON_TYPE_ALIASES } from '@mongodb-js/mongodb-constants';
import type { Ace } from 'ace-builds';
import type { CompletionWithServerInfo } from '../types';
import { filter, MATCH_COMPLETIONS } from './util';

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
      const strings = ([] as CompletionWithServerInfo[]).concat(
        BSON_TYPE_ALIASES,
        this.fields
      );
      return done(null, filter(this.version, strings, prefix));
    }
    // If the current token is not a string, then we proceed as normal to suggest
    // operators to the user.
    const expressions = MATCH_COMPLETIONS.concat(this.fields, JSON_SCHEMA);
    return done(null, filter(this.version, expressions, prefix));
  };
}

export { ValidationAutoCompleter };

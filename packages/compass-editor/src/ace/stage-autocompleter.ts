import { QueryAutoCompleter } from './query-autocompleter';
import type { Ace } from 'ace-builds';
import type { CompletionWithServerInfo } from '../types';
import { completer } from '../autocompleter';

/**
 * The proect stage operator.
 */
const PROJECT = '$project';

/**
 * The group stage operator.
 */
const GROUP = '$group';

/**
 * The match operator.
 */
const MATCH = '$match';

/**
 * The dollar const.
 */
const DOLLAR = '$';

/**
 * Adds autocomplete suggestions based on the aggregation pipeline
 * operators.
 */
class StageAutoCompleter implements Ace.Completer {
  queryAutoCompleter: QueryAutoCompleter;
  constructor(
    public version: string,
    public textCompleter: Ace.Completer,
    public fields: CompletionWithServerInfo[],
    public stageOperator: string | null = null
  ) {
    this.queryAutoCompleter = new QueryAutoCompleter(
      version,
      textCompleter,
      fields
    );
  }

  update(
    fields: CompletionWithServerInfo[],
    stageOperator: string | null,
    severVersion?: string
  ) {
    this.fields = fields;
    this.queryAutoCompleter.update(fields);
    this.stageOperator = stageOperator;
    this.version = severVersion ?? this.version;
  }

  updateStageOperator(stageOperator: string | null) {
    this.stageOperator = stageOperator;
  }

  getCompletions: Ace.Completer['getCompletions'] = (
    editor,
    session,
    position,
    prefix,
    done
  ) => {
    // Empty prefixes do not return results.
    if (prefix === '') {
      return done(null, []);
    }
    const currentToken = session.getTokenAt(position.row, position.column);
    if (!currentToken) {
      return done(null, []);
    }
    // If the current token is a string with single or double quotes, then
    // we want to use the local text completer instead of suggesting operators.
    // This is so we can suggest user variable names inside the pipeline that they
    // have already typed.
    if (currentToken.type === 'string') {
      if (prefix.startsWith(DOLLAR)) {
        return done(
          null,
          completer(prefix, {
            fields: this.fields
              .filter(
                (field): field is CompletionWithServerInfo & { name: string } =>
                  !!field.name
              )
              .map((field) => field.name),
            meta: ['field:reference'],
          })
        );
      }
      return this.textCompleter.getCompletions(
        editor,
        session,
        position,
        prefix,
        done
      );
    }
    // Comments block do not return results.
    if (currentToken?.type.includes('comment')) {
      return done(null, []);
    }
    // If the current token is not a string, then we proceed as normal to suggest
    // operators to the user.
    if (this.stageOperator && this.stageOperator === MATCH) {
      this.queryAutoCompleter.getCompletions(
        editor,
        session,
        position,
        prefix,
        done
      );
    } else {
      return done(
        null,
        completer(prefix, {
          serverVersion: this.version,
          fields: this.fields
            .filter(
              (field): field is CompletionWithServerInfo & { name: string } =>
                !!field.name
            )
            .map((field) => field.name),
          meta: [
            'expr:*',
            'conv',
            'bson',
            'field:identifier',
            ...([PROJECT, GROUP].includes(this.stageOperator ?? '')
              ? (['accumulator', 'accumulator:*'] as const)
              : []),
          ],
        })
      );
    }
  };
}

export { StageAutoCompleter };

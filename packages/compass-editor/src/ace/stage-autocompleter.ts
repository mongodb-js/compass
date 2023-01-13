import semver from 'semver';
import {
  EXPRESSION_OPERATORS,
  CONVERSION_OPERATORS,
  BSON_TYPES,
  ACCUMULATORS,
} from '@mongodb-js/mongodb-constants';
import { filter } from './util';
import { QueryAutoCompleter } from './query-autocompleter';
import type { Ace } from 'ace-builds';
import type { CompletionWithServerInfo } from '../types';

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
 * The base completions.
 */
const BASE_COMPLETIONS = ([] as CompletionWithServerInfo[]).concat(
  EXPRESSION_OPERATORS,
  CONVERSION_OPERATORS,
  BSON_TYPES
);

/**
 * Adds autocomplete suggestions based on the aggregation pipeline
 * operators.
 */
class StageAutoCompleter implements Ace.Completer {
  variableFields: CompletionWithServerInfo[];
  queryAutoCompleter: QueryAutoCompleter;
  constructor(
    public version: string,
    public textCompleter: Ace.Completer,
    public fields: CompletionWithServerInfo[],
    public stageOperator: string | null = null
  ) {
    this.variableFields = this.generateVariableFields(fields);
    this.queryAutoCompleter = new QueryAutoCompleter(
      version,
      textCompleter,
      fields
    );
  }

  accumulators() {
    if (this.stageOperator) {
      if (this.stageOperator === PROJECT) {
        return ACCUMULATORS.filter((acc) => {
          if ('projectVersion' in acc) {
            return semver.gte(this.version, acc.projectVersion);
          }
          return false;
        });
      } else if (this.stageOperator === GROUP) {
        return ACCUMULATORS;
      }
    }
    return [];
  }

  update(
    fields: CompletionWithServerInfo[],
    stageOperator: string | null,
    severVersion?: string
  ) {
    this.fields = fields;
    this.variableFields = this.generateVariableFields(fields);
    this.queryAutoCompleter.update(fields);
    this.stageOperator = stageOperator;
    this.version = severVersion ?? this.version;
  }

  updateStageOperator(stageOperator: string | null) {
    this.stageOperator = stageOperator;
  }

  generateVariableFields(
    fields: CompletionWithServerInfo[]
  ): CompletionWithServerInfo[] {
    return fields.map((field) => {
      return {
        ...(field.name && { name: `$${field.name.replace(/"/g, '')}` }),
        value: `$${field.value.replace(/"/g, '')}`,
        meta: field.meta,
        version: field.version,
        score: 1,
      };
    });
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
      if (prefix === DOLLAR) {
        return done(null, this.variableFields);
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
      const expressions = BASE_COMPLETIONS.concat(this.accumulators()).concat(
        this.fields
      );
      return done(null, filter(this.version, expressions, prefix));
    }
  };
}

export { StageAutoCompleter };

import type { CompletionSource } from '@codemirror/autocomplete';
import { completer, wrapField } from '../autocompleter';
import { languageName } from '../editor';
import {
  resolveTokenAtCursor,
  completeWordsInString,
  isPropertyValue,
  mapMongoDBCompletionToCodemirrorCompletion,
} from './utils';
import type { Token } from './utils';

function isJSONPropertyName(token: Token): boolean {
  return (
    // Cursor is currently on the valid property name in the object
    token.name === 'PropertyName' ||
    // Cursor is possibly on the invalid property name as indicated by the
    // previous sibling being a property or an open bracket and not a
    // `PropertyName`, which would be the case for property value
    (token.type.isError &&
      ['Property', '{'].includes(token.prevSibling?.name ?? ''))
  );
}
function isJavaScriptPropertyName(token: Token): boolean {
  return (
    // Cursor is currently inside a property
    token.parent?.name === 'Property' &&
    // There is no previous sibling or it's an opening bracket (indicating
    // computed property)
    (!token.prevSibling || token.prevSibling.name === '[')
  );
}

/**
 * Autocompleter for the document object. Completes field names in the
 * appropriate format (either escaped or not) both for javascript and json
 * modes, and bson constructors (`ObjectId()`, `ISODate()`, ...) in value
 * position, which are only valid outside of json mode.
 */
export const createDocumentAutocompleter = (
  fields: string[]
): CompletionSource => {
  const completions = completer('', { fields, meta: ['field:identifier'] });
  const bsonCompletions = completer('', { meta: ['bson'] });

  return (context) => {
    const token = resolveTokenAtCursor(context);

    const isJSON = context.state.facet(languageName)[0] === 'json';
    const shouldAlwaysEscapeProperty = isJSON;

    if (isJSONPropertyName(token) || isJavaScriptPropertyName(token)) {
      const prefix = context.state
        .sliceDoc(token.from, context.pos)
        .replace(/^("|')/, '');

      return {
        from: token.from,
        to: token.to,
        options: completions
          .filter((completion) => {
            return completion.value
              .toLowerCase()
              .startsWith(prefix.toLowerCase());
          })
          .map((completion) => {
            return {
              label: wrapField(completion.value, shouldAlwaysEscapeProperty),
              // https://codemirror.net/docs/ref/#autocomplete.Completion.type
              type: 'property',
              detail: 'field',
            };
          }),
        filter: false,
      };
    }

    if (!isJSON && token.type.name !== 'String' && isPropertyValue(token)) {
      const prefix = context.state.sliceDoc(token.from, context.pos);

      if (!prefix) {
        return null;
      }

      return {
        from: token.from,
        to: token.to,
        options: bsonCompletions
          .filter((completion) => {
            return completion.value
              .toLowerCase()
              .startsWith(prefix.toLowerCase());
          })
          .map((completion) => {
            // bson constructors are expressions, never quoted like a field name
            return mapMongoDBCompletionToCodemirrorCompletion(
              completion,
              'never'
            );
          }),
        filter: false,
      };
    }

    return completeWordsInString(context);
  };
};

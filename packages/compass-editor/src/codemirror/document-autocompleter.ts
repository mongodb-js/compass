import type { CompletionSource } from '@codemirror/autocomplete';
import { completer, wrapField } from '../autocompleter';
import { languageName } from '../editor';
import { resolveTokenAtCursor, completeWordsInString } from './utils';
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
 * Autocompleter for the document object, only autocompletes field names in the
 * appropriate format (either escaped or not) both for javascript and json modes
 */
export const createDocumentAutocompleter = (
  fields: string[]
): CompletionSource => {
  const completions = completer('', { fields, meta: ['field:identifier'] });

  return (context) => {
    const token = resolveTokenAtCursor(context);

    const shouldAlwaysEscapeProperty =
      context.state.facet(languageName)[0] === 'json';

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

    return completeWordsInString(context);
  };
};

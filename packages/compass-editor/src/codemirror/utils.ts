import { completeAnyWord, ifIn } from '@codemirror/autocomplete';
import type { CompletionContext } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

export const ARRAY_ITEM_REGEX = /(\[(\d)+\])/;

/**
 * Regex to match the property names which are extracted from the ancestors list.
 * Property names always end with a `:` and can be either unquoted or quoted (single or double).
 * 1. Unquoted property names: [^\s\"\']*
 * 2. Double quoted property names: \"[^"]*\"
 * 3. Single quoted property names: \'[^\']*\'
 * 4. Any whitespace just before ending colon: (\s)*
 * 5. String ending with a colon: (?=:$)
 */
const PROPERTY_ITEM_REGEX = /([^\s"']*|"[^"]*"|'[^']*')(\s)*(?=:$)/;

export const completeWordsInString = ifIn(['String'], completeAnyWord);

export function resolveTokenAtCursor(context: CompletionContext) {
  return syntaxTree(context.state).resolveInner(context.pos - 1);
}

export type Token = ReturnType<typeof resolveTokenAtCursor>;

/**
 * Returns the list of possible ancestors of the token.
 */
const getAncestorList = (node: Token | null, doc: string): string[] => {
  const ancestors: string[] = [];

  if (!node?.parent) {
    return ancestors;
  }

  // In order to find the index of an node in an array, we have to check for the parent.
  // And then use siblings to find the index. We can't use the node.parent as it does not
  // contain all the childern and reference to the current node.
  if (['ArrayExpression', 'Array'].includes(node.parent.name)) {
    let prevSibling = node.prevSibling;
    let index = 0;
    while (prevSibling) {
      if (![':', ',', '['].includes(prevSibling.name)) {
        index++;
      }
      prevSibling = prevSibling.prevSibling;
    }
    ancestors.push(`[${index}]`);
  }
  // We slice the document from the start to the current node's start position
  // This correctly gives us the value of parent node (its corresponding text).
  // And for a valid ancestor, it has to be a property name, meaning it ends
  // with a `:` or if its a root, it will be an empty string.
  ancestors.push(doc.slice(0, node.from));
  return ancestors.concat(getAncestorList(node.parent, doc));
};

/**
 * Filter out the invalid property names.
 * Exported for testing.
 */
export const filterAndNormalizeAncestorList = (parent: string[]): string[] => {
  return parent
    .map((x) => {
      if (x.match(ARRAY_ITEM_REGEX)) {
        return x;
      }
      return (x.trim().match(PROPERTY_ITEM_REGEX)?.[0] ?? '')
        .replace(/"/g, '')
        .replace(/'/g, '')
        .trim();
    })
    .filter(Boolean);
};

/**
 * Walks the syntax tree from the token and returns a list
 * of all the ancestors of the token. The array indexes are
 * represented as `[0-9]`.
 */
export function getAncestryOfToken(token: Token, document: string): string[] {
  // We reverse the list as we want to start from the root.
  const list = getAncestorList(token, document).reverse();
  return filterAndNormalizeAncestorList(list);
}

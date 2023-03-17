import { completeAnyWord, ifIn } from '@codemirror/autocomplete';
import type { CompletionContext } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

export const completeWordsInString = ifIn(['String'], completeAnyWord);

export function resolveTokenAtCursor(context: CompletionContext) {
  return syntaxTree(context.state).resolveInner(context.pos - 1);
}

export type Token = ReturnType<typeof resolveTokenAtCursor>;

/**
 * Returns the list of possible ancestors of the token.
 */
const getAncestorList = (
  node: Token | undefined | null,
  doc: string
): string[] => {
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
  if (node.name === 'Property' && node.firstChild) {
    const { from, to } = node.firstChild;
    const ancestor = doc.slice(from, to).replace(/"/g, '').replace(/'/g, '');
    ancestors.push(ancestor);
  }
  return ancestors.concat(getAncestorList(node.parent, doc));
};

/**
 * Walks the syntax tree from the token and returns a list
 * of all the ancestors of the token. The array indexes are
 * represented as `[0-9]`.
 */
export function getAncestryOfToken(token: Token, document: string): string[] {
  // If we are at the property name, we ignore it to correctly
  // find the parent.
  const isAutocompletingPropertyName =
    ['ObjectExpression', 'PropertyDefinition'].includes(token.name) ||
    (token.parent?.parent?.name === 'ObjectExpression' && !token.prevSibling);
  // We reverse the list as we want to start from the root.
  const list = getAncestorList(
    isAutocompletingPropertyName ? token.parent?.parent : token,
    document
  ).reverse();
  return list;
}

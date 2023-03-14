import { CompletionContext } from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

export const ARRAY_ITEM_REGEX = /(\[(\d)+\])/;

export function resolveTokenAtCursor(context: CompletionContext) {
  return syntaxTree(context.state).resolveInner(context.pos, -1);
}

export type Token = ReturnType<typeof resolveTokenAtCursor>;

/**
 * todo: add a comment for the string we push to array.
 *
 * Returns the list of ancestors of the token.
 */
const getAncestorList = (node: Token | null, doc: string): string[] => {
  let ancestors: string[] = [];

  if (!node?.parent) {
    return ancestors;
  }

  // Ignore the array and object brackets
  if (['{', '['].includes(node.name)) {
    return ancestors.concat(getAncestorList(node.parent, doc));
  }

  // In order to find the index of an node in an array, we have to check for the parent.
  // And then use siblings to find the index. We can't use the node.parent as it does not
  // contain all the childern and reference to the current node.
  // Also, in an array, the first sibling is the opening bracket ([). So we start with -1.
  if (node.parent.name === 'Array') {
    let prevSibling = node.prevSibling;
    let index = -1;
    while (prevSibling) {
      index++;
      prevSibling = prevSibling.prevSibling;
    }
    ancestors.push(`[${index}]`);
  }
  ancestors.push(doc.slice(0, node.from).trim());
  return ancestors.concat(getAncestorList(node.parent, doc));
};

const normalizeAncestorList = (parent: string[]): string[] => {
  // First part matches the js keys (with no quotes) and the
  // second part matches the json keys (with quotes).
  const propertyRegex = /(([^\s\"\']*)|((\")[^"]*(\")))(?=:$)/;
  return parent
    .reverse()
    .map((x) => {
      // The array index
      if (x.match(ARRAY_ITEM_REGEX)) {
        return x;
      }
      return (x.match(propertyRegex)?.[0] ?? '').replace(/\"/g, '');
    })
    .filter(Boolean) as string[];
};

/**
 * Walks the syntax tree from the token and returns a list
 * of all the ancestors of the token. The array indexes are
 * represented as `[0-9]`.
 */
export function getAncestryOfToken(token: Token, document: string): string[] {
  const list = getAncestorList(token, document);
  // todo: remove
  // console.log('list', list, token);
  // console.table({
  //   'token.name': [
  //     `${token.name} -> ${0}-${token?.from}`,
  //     document.slice(0, token?.from),
  //   ],
  //   'token?.parent?.name': [
  //     `${token?.parent?.name} -> ${0} - ${token?.parent?.from}`,
  //     document.slice(0, token?.parent?.from),
  //   ],
  //   'token?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.parent?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.from)
  //   ],
  //   'token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.name': [
  //     `${token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.name} -> ${0} - ${token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.from}`,
  //     document.slice(0, token?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.parent?.from)
  //   ],
  // });
  return normalizeAncestorList(list);
}

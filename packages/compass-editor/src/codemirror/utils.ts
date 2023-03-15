import {
  CompletionContext,
  completeAnyWord,
  ifIn,
} from '@codemirror/autocomplete';
import { syntaxTree } from '@codemirror/language';

export const completeWordsInString = ifIn(['String'], completeAnyWord);

export function resolveTokenAtCursor(context: CompletionContext) {
  return syntaxTree(context.state).resolveInner(context.pos - 1);
}

export type Token = ReturnType<typeof resolveTokenAtCursor>;

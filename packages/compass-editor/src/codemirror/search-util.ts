import type { EditorView } from '@codemirror/view';
import type { EditorState } from '@codemirror/state';
import {
  SearchQuery,
  setSearchQuery,
  getSearchQuery,
  findNext as cmFindNext,
  findPrevious as cmFindPrevious,
} from '@codemirror/search';

/**
 * Result of a search interaction with the editor.
 *
 * - `count` is the total number of matches for the active query.
 * - `current` is the 1-based index of the currently selected match, or `0`
 *   when there is no active match (e.g. before navigating, or no matches).
 */
export type EditorSearchResult = {
  count: number;
  current: number;
};

const EMPTY_RESULT: EditorSearchResult = { count: 0, current: 0 };

function collectMatches(
  state: EditorState,
  query: SearchQuery
): { from: number; to: number }[] {
  const matches: { from: number; to: number }[] = [];
  if (!query.search || !query.valid) {
    return matches;
  }
  // `getCursor` returns an iterator over all matches in the document for the
  // given query. We materialize it so we can both count matches and locate
  // the currently selected one.
  const cursor = query.getCursor(state);
  let next = cursor.next();
  while (!next.done) {
    matches.push({ from: next.value.from, to: next.value.to });
    next = cursor.next();
  }
  return matches;
}

function computeResult(view: EditorView): EditorSearchResult {
  const query = getSearchQuery(view.state);
  if (!query.search) {
    return EMPTY_RESULT;
  }
  const matches = collectMatches(view.state, query);
  const selection = view.state.selection.main;
  let current = 0;
  for (let i = 0; i < matches.length; i++) {
    if (matches[i].from === selection.from && matches[i].to === selection.to) {
      current = i + 1;
      break;
    }
  }
  return { count: matches.length, current };
}

/**
 * Sets the active search term and selects the first match at or after the
 * current cursor position. Searches are literal (special characters are not
 * interpreted) and case-insensitive, matching the expectations of a simple
 * "find within document" affordance.
 */
export function setSearchTerm(
  view: EditorView,
  term: string
): EditorSearchResult {
  const query = new SearchQuery({
    search: term,
    caseSensitive: false,
    literal: true,
  });
  view.dispatch({ effects: setSearchQuery.of(query) });
  if (term) {
    cmFindNext(view);
  }
  return computeResult(view);
}

export function goToNextMatch(view: EditorView): EditorSearchResult {
  cmFindNext(view);
  return computeResult(view);
}

export function goToPreviousMatch(view: EditorView): EditorSearchResult {
  cmFindPrevious(view);
  return computeResult(view);
}

export function clearSearchTerm(view: EditorView): void {
  view.dispatch({
    effects: setSearchQuery.of(new SearchQuery({ search: '' })),
  });
}

export function getSearchResult(view: EditorView): EditorSearchResult {
  return computeResult(view);
}

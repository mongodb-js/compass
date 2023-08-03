import detect from 'mongodb-query-parser';

export enum FixQueryAction {
  NOTHING_FIXED,
  ADDED_WRAPPING_BRACES_ON_EMPTY,
  ADDED_WRAPPING_BRACES,
  REMOVED_WRAPPING_BRACES,
}

function _isValidQuery(query: string): boolean {
  try {
    return !!detect(query);
  } catch (ex) {
    return false;
  }
}

export function lenientlyFixQuery(query: string): [FixQueryAction, string] {
  query = query.trim();
  if (query === '') {
    return [FixQueryAction.ADDED_WRAPPING_BRACES_ON_EMPTY, '{}'];
  }

  if (query.length === 1) {
    return [FixQueryAction.ADDED_WRAPPING_BRACES, `{${query}}`];
  }

  const isValid = _isValidQuery(query);

  if (!isValid) {
    if (query[0] === '{' && query[query.length - 1] === '}') {
      const queryWithoutWrappingBraces = query.substring(1, query.length - 1);
      const isInnerQueryValid = _isValidQuery(queryWithoutWrappingBraces);
      if (isInnerQueryValid) {
        return [
          FixQueryAction.REMOVED_WRAPPING_BRACES,
          queryWithoutWrappingBraces,
        ];
      }
    }
  }

  return [FixQueryAction.NOTHING_FIXED, query];
}

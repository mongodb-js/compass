import detect from 'mongodb-query-parser';

export type CursorPlacement = number | undefined;

const _detect = detect as unknown as (query: string) => boolean;
function _isValidQuery(query: string): boolean {
  try {
    return !!_detect(query);
  } catch (ex) {
    return false;
  }
}

export function lenientlyFixQuery(query: string): [string, CursorPlacement] {
  query = query.trim();
  let modified = false;
  let positioning: CursorPlacement = undefined;

  if (query === '') {
    return ['{}', 1];
  }

  const isValid = _isValidQuery(query);

  if (!isValid) {
    if (query.startsWith('{') && query.endsWith('}')) {
      const queryWithoutWrappingBraces = query.substring(1, query.length - 1);
      const isInnerQueryValid = _isValidQuery(queryWithoutWrappingBraces);
      if (isInnerQueryValid) {
        modified = true;
        query = queryWithoutWrappingBraces;
      }
    } else {
      const wrappedQuery = `{${query}}`;
      if (_isValidQuery(wrappedQuery)) {
        modified = true;
        query = wrappedQuery;
      }
    }
  }

  if (modified) {
    positioning = query.lastIndexOf('}');
  }

  return [query, positioning];
}

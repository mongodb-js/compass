import detect from 'mongodb-query-parser';

export type CursorPlacement = number | undefined;

function _isValidQuery(query: string): boolean {
  try {
    return !!detect(query);
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

  if (query.startsWith('{}')) {
    query = query.substring(2);
    modified = true;
  }

  if (query.endsWith('{}')) {
    query = query.substring(0, query.length - 2);
    modified = true;
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

import parseQuery from 'mongodb-query-parser';

function _isValidQuery(query: string): boolean {
  try {
    return !!parseQuery(query);
  } catch {
    return false;
  }
}

export function lenientlyFixQuery(query: string): string | false {
  query = query.trim();
  let modified = false;

  if (query === '') {
    return '\\{${}}';
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
    query = query.replaceAll('{', '\\{');
    const caretPosition = query.lastIndexOf('}');

    query =
      query.substring(0, caretPosition) +
      '${}' +
      query.substring(caretPosition);
    return query;
  }

  return false;
}

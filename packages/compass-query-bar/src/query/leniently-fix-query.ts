import parseQuery from 'mongodb-query-parser';

function _isValidQuery(query: string): boolean {
  try {
    return !!parseQuery(query);
  } catch {
    return false;
  }
}

// Add _id: ObjectId("<id>") when a user pastes only an object id.
function _fixObjectIdInQuery(query: string): string | undefined {
  const objectIdRegex = /^{([0-9a-fA-F]{24})}$/;

  const match = query.match(objectIdRegex);
  if (match) {
    return `{ _id: ObjectId("${match[1]}") }`;
  }
}

function _fixBraceEscapingInQuery(query: string): string | undefined {
  const isValid = _isValidQuery(query);

  if (isValid) {
    return;
  }

  if (query.startsWith('{') && query.endsWith('}')) {
    const queryWithoutWrappingBraces = query.substring(1, query.length - 1);
    const isInnerQueryValid = _isValidQuery(queryWithoutWrappingBraces);
    if (isInnerQueryValid) {
      return queryWithoutWrappingBraces;
    }
  } else {
    const wrappedQuery = `{${query}}`;
    if (_isValidQuery(wrappedQuery)) {
      return wrappedQuery;
    }
  }
}

export function lenientlyFixQuery(query: string): string | false {
  query = query.trim();

  if (query === '') {
    return '\\{${}}';
  }

  let modified = false;

  const fixedObjectId = _fixObjectIdInQuery(query);
  if (fixedObjectId) {
    modified = true;
    query = fixedObjectId;
  }

  const fixedBraceEscaping = _fixBraceEscapingInQuery(query);
  if (fixedBraceEscaping) {
    modified = true;
    query = fixedBraceEscaping;
  }

  if (!modified) {
    return false;
  }

  // Add template formatting to put the cursor position before the last closing brace.
  query = query.replaceAll('{', '\\{');
  const caretPosition = query.lastIndexOf('}');

  query =
    query.substring(0, caretPosition) + '${}' + query.substring(caretPosition);
  return query;
}

/**
  Taken from https://github.com/mongodb/chatbot/blob/004a61464c2c25d6b61ad943d1ad9b2fc934eb73/packages/chatbot-server-mongodb-public/src/eval/fuzzyLinkMatch.ts#L16

  Performs a case-insensitive match between two URLs or URL fragments.
  
  First attempts to match based on paths:
  - Removes trailing slashes
  - Checks if actual path ends with expected path (ignoring domain, query, and fragment)
  
  If either path is empty/invalid, falls back to exact match of normalized URLs.
  
  @param expected - The expected URL or URL fragment
  @param actual - The actual URL or URL fragment to compare against
  @returns true if URLs match according to above rules, false otherwise
 */

type NormalizeUrlParams = {
  url: string;
  removeHash?: boolean;
  removeQueryString?: boolean;
};

// Regex used to get just the "front part" of a URL
const optionalRegex = {
  REMOVE_HASH: /^[^#]+/,
  REMOVE_QUERY: /^[^?]+/,
  REMOVE_BOTH: /^[^?#]+/,
};

/**
  Utility function that normalizes a URL.
  Removes http/s protocol, www, trailing backslashes.
  Optionally removes query string and hash fragment.
*/
export function normalizeUrl({
  url,
  removeHash = true,
  removeQueryString = true,
}: NormalizeUrlParams): string {
  if (removeHash && removeQueryString) {
    url = (url.match(optionalRegex.REMOVE_BOTH) ?? [url])[0];
  } else if (removeHash) {
    url = (url.match(optionalRegex.REMOVE_HASH) ?? [url])[0];
  } else if (removeQueryString) {
    // Splitting on hash so we retain the hash fragment
    const [frontUrl, hashFragment] = url.split('#');
    url = (frontUrl.match(optionalRegex.REMOVE_QUERY) ?? [url])[0];
    url += hashFragment ? `#${hashFragment}` : '';
  }
  return url
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '');
}

export function fuzzyLinkMatch(expected: string, actual: string) {
  const cleanActualPath = getCleanPath(actual);
  const cleanExpectedPath = getCleanPath(expected);

  // if cleaned path is not an empty string, compare cleaned paths
  if (cleanActualPath && cleanExpectedPath) {
    return cleanActualPath.endsWith(cleanExpectedPath);
  } else {
    // compare normalized full URLs
    const normalizedActual = normalizeUrl({ url: actual });
    const normalizedExpected = normalizeUrl({ url: expected });
    return normalizedActual === normalizedExpected;
  }
}

function cleanPath(path: string) {
  return path.toLowerCase().replace(/\/$/, '');
}

function getCleanPath(maybeUrl: string) {
  let out = '';
  try {
    const url = new URL(maybeUrl);
    out = cleanPath(url.pathname);
  } catch {
    // If it's not a valid URL, return the input string as is
    out = cleanPath(maybeUrl);
  }
  return out;
}

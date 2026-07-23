import { ParseMode } from '@mongodb-js/shell-bson-parser';
import { EJSON, UUID } from 'bson';

type BSONObject = Record<string, unknown>;

const parserWorker = new Worker(
  new URL(
    './parse-shell-bson-worker',
    // @ts-expect-error required for correct compilation, but causes some issues with our tsconfig. TODO look into this a bit more
    import.meta.url
  ),
  { type: 'module', credentials: 'omit' }
);

const ParseRequests = new Map();

parserWorker.onmessage = (ev) => {
  const { requestId, result, error } = ev.data;
  const resolvers = ParseRequests.get(requestId);
  if (!resolvers) {
    return;
  }
  if (result) {
    resolvers.resolve(EJSON.deserialize(result));
  } else {
    resolvers.reject(error);
  }
  ParseRequests.delete(requestId);
};

async function requestParse(
  source: string,
  // TODO: types
  options: any
  // TODO: abort
) {
  const resolvers = Promise.withResolvers();
  const requestId = new UUID().toString();
  ParseRequests.set(requestId, resolvers);
  parserWorker.postMessage({
    requestId,
    source,
    ...options,
  });
  try {
    return await resolvers.promise;
  } finally {
    ParseRequests.delete(requestId);
  }
}

export function parseShellBSON(
  source: string
): Promise<BSONObject | BSONObject[]> {
  return requestParse(source, {
    mode: ParseMode.Strict,
    allowComments: true,
    allowMethods: true,
  }) as Promise<BSONObject | BSONObject[]>;
}

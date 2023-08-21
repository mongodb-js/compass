import type * as plugin from '@mongodb-js/oidc-plugin';

export type UserInfo = {
  firstName: string;
  lastName: string;
  primaryEmail: string;
  login: string;
};

export type IntrospectInfo = { active: boolean };

export type Token = plugin.IdPServerResponse;

function hasExtraneousKeys(obj: any, expectedKeys: string[]) {
  return (
    Object.keys(obj).some((key) => !expectedKeys.includes(key))
  );
}

export type AIAggregation = {
  content: {
    aggregation?: {
      pipeline?: string;
    };
  };
};

export function validateAIAggregationResponse(
  response: any
): asserts response is AIAggregation {
  const { content } = response;

  if (typeof content !== 'object' || content === null) {
    throw new Error('Unexpected response: expected content to be an object');
  }

  if (hasExtraneousKeys(content, ['aggregation'])) {
    throw new Error('Unexpected keys in response: expected aggregation');
  }

  if (content.aggregation && typeof content.aggregation.pipeline !== 'string') {
    // Compared to queries where we will always get the `query` field, for
    // aggregations backend deletes the whole `aggregation` key if pipeline is
    // empty, so we only validate `pipeline` key if `aggregation` key is present
    throw new Error(
      `Unexpected response: expected aggregation to be a string, got ${String(
        content.aggregation.pipeline
      )}`
    );
  }
}

export type AIQuery = {
  content: {
    query: Record<
      'filter' | 'project' | 'collation' | 'sort' | 'skip' | 'limit',
      string
    > & { aggregation?: { pipeline: string } };
  };
};

export function validateAIQueryResponse(
  response: any
): asserts response is AIQuery {
  const { content } = response ?? {};

  if (typeof content !== 'object' || content === null) {
    throw new Error('Unexpected response: expected content to be an object');
  }

  if (hasExtraneousKeys(content, ['query'])) {
    throw new Error('Unexpected keys in response: expected query');
  }

  const { query } = content;

  if (typeof query !== 'object' || query === null) {
    throw new Error('Unexpected response: expected query to be an object');
  }

  if (
    hasExtraneousKeys(query, [
      'filter',
      'project',
      'collation',
      'sort',
      'skip',
      'limit',
      'aggregation',
    ])
  ) {
    throw new Error(
      'Unexpected keys in response: expected filter, project, collation, sort, skip, limit, aggregation'
    );
  }

  for (const field of [
    'filter',
    'project',
    'collation',
    'sort',
    'skip',
    'limit',
  ]) {
    if (query[field] && typeof query[field] !== 'string') {
      throw new Error(
        `Unexpected response: expected field ${field} to be a string, got ${String(
          query[field]
        )}`
      );
    }
  }

  if (query.aggregation && typeof query.aggregation.pipeline !== 'string') {
    throw new Error(
      `Unexpected response: expected aggregation pipeline to be a string, got ${String(
        query.aggregation
      )}`
    );
  }
}

export type AtlasServiceNetworkError = Error & { statusCode: number };

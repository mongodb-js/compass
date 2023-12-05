import type * as plugin from '@mongodb-js/oidc-plugin';
import util from 'util';
import type { AtlasUserConfig } from './user-config-store';

export type AtlasUserInfo = {
  sub: string;
  firstName: string;
  lastName: string;
  primaryEmail: string;
  login: string;
} & AtlasUserConfig;

export type IntrospectInfo = { active: boolean };

export type Token = plugin.IdPServerResponse;

function hasExtraneousKeys(obj: any, expectedKeys: string[]) {
  return Object.keys(obj).some((key) => !expectedKeys.includes(key));
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

export type AIFeatureEnablement = {
  features: {
    [featureName: string]: {
      enabled: boolean;
    };
  };
};

export function validateAIFeatureEnablementResponse(
  response: any
): asserts response is AIFeatureEnablement {
  const { features } = response;

  if (typeof features !== 'object') {
    throw new Error('Unexpected response: expected features to be an object');
  }
}

export type AIQuery = {
  content: {
    query: Record<
      'filter' | 'project' | 'collation' | 'sort' | 'skip' | 'limit',
      string
    >;
    aggregation?: { pipeline: string };
  };
};

export function validateAIQueryResponse(
  response: any
): asserts response is AIQuery {
  const { content } = response ?? {};

  if (typeof content !== 'object' || content === null) {
    throw new Error('Unexpected response: expected content to be an object');
  }

  if (hasExtraneousKeys(content, ['query', 'aggregation'])) {
    throw new Error(
      'Unexpected keys in response: expected query and aggregation'
    );
  }

  const { query, aggregation } = content;

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
        `Unexpected response: expected field ${field} to be a string, got ${util.inspect(
          query[field]
        )}`
      );
    }
  }

  if (aggregation && typeof aggregation.pipeline !== 'string') {
    throw new Error(
      `Unexpected response: expected aggregation pipeline to be a string, got ${util.inspect(
        aggregation
      )}`
    );
  }
}

// See: https://www.mongodb.com/docs/atlas/api/atlas-admin-api-ref/#errors
export class AtlasServiceError extends Error {
  statusCode: number;
  errorCode: string;
  detail: string;

  constructor(
    name: 'NetworkError' | 'ServerError',
    statusCode: number,
    detail: string,
    errorCode: string
  ) {
    super(`${errorCode}: ${detail}`);
    this.name = name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.detail = detail;
  }
}

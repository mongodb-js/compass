import type { Logger } from '@mongodb-js/compass-logging';
import parse, { toJSString } from 'mongodb-query-parser';

type ParsedXmlJsonResponse = {
  content: {
    query?: {
      filter: string | null;
      project: string | null;
      sort: string | null;
      skip: string | null;
      limit: string | null;
    };
    aggregation?: {
      pipeline: string;
    };
  };
};

export function parseXmlToJsonResponse(
  xmlString: string,
  logger: Logger
): ParsedXmlJsonResponse {
  const expectedTags = [
    'filter',
    'project',
    'sort',
    'skip',
    'limit',
    'aggregation',
  ] as const;

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(
    `<root>${xmlString}</root>`,
    'text/xml'
  );

  // Currently the prompt forces LLM to return xml-styled data
  const result: Record<(typeof expectedTags)[number], string | null> = {
    filter: null,
    project: null,
    sort: null,
    skip: null,
    limit: null,
    aggregation: null,
  };
  for (const tag of expectedTags) {
    const value = xmlDoc.querySelector(tag)?.textContent?.trim();
    if (value) {
      try {
        const tagValue = parse(value);
        if (
          !tagValue ||
          (typeof tagValue === 'object' && Object.keys(tagValue).length === 0)
        ) {
          result[tag] = null;
        } else {
          // No indentation
          result[tag] = toJSString(tagValue, 0) ?? null;
        }
      } catch (e) {
        logger.log.warn(
          logger.mongoLogId(1_001_000_384),
          'AtlasAiService',
          `Failed to parse value for tag <${tag}>: ${value}`,
          { error: e }
        );
        result[tag] = null;
      }
    }
  }

  const { aggregation, ...query } = result;
  const isQueryEmpty = Object.values(query).every((v) => v === null);

  // It prioritizes aggregation over query if both are present
  if (aggregation && !isQueryEmpty) {
    return {
      content: {
        aggregation: {
          pipeline: aggregation,
        },
        query: {
          filter: null,
          project: null,
          sort: null,
          skip: null,
          limit: null,
        },
      },
    };
  }
  return {
    content: {
      ...(aggregation
        ? {
            aggregation: {
              pipeline: aggregation,
            },
          }
        : {}),
      ...(isQueryEmpty ? {} : { query }),
    },
  };
}

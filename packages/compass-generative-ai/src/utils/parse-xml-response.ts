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
  {
    logger,
    type,
  }: {
    logger: Logger;
    type: 'find' | 'aggregate';
  }
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
  const result: Record<(typeof expectedTags)[number], string | null> =
    Object.create(null);

  for (const tag of expectedTags) {
    result[tag] = null;

    const value = xmlDoc.querySelector(tag)?.textContent?.trim();
    if (!value) {
      continue;
    }

    try {
      const tagValue = parse(value);
      if (
        tagValue &&
        !(typeof tagValue === 'object' && Object.keys(tagValue).length === 0)
      ) {
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
    }
  }

  const { aggregation: pipeline, ...query } = result;

  const aggregation = {
    pipeline: pipeline ?? '',
  };
  // For aggregation, we only return aggregation field
  if (type === 'aggregate') {
    return {
      content: {
        aggregation,
      },
    };
  }

  return {
    content: {
      query,
      aggregation,
    },
  };
}

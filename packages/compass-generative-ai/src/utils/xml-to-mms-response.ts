import type { Logger } from '@mongodb-js/compass-logging';
import parse, { toJSString } from 'mongodb-query-parser';

export function parseXmlToMmsJsonResponse(xmlString: string, logger: Logger) {
  const expectedTags = [
    'filter',
    'project',
    'sort',
    'skip',
    'limit',
    'aggregation',
  ];

  // Currently the prompt forces LLM to return xml-styled data
  const result: any = {};
  for (const tag of expectedTags) {
    const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xmlString.match(regex);
    if (match && match[1]) {
      const value = match[1].trim();
      try {
        const tagValue = parse(value);
        if (
          !tagValue ||
          (typeof tagValue === 'object' && Object.keys(tagValue).length === 0)
        ) {
          result[tag] = null;
        } else {
          // No indentation
          result[tag] = toJSString(tagValue, 0);
        }
      } catch (e) {
        logger.log.warn(
          logger.mongoLogId(1_001_000_309),
          'AtlasAiService',
          `Failed to parse value for tag <${tag}>: ${value}`,
          { error: e }
        );
        result[tag] = null;
      }
    }
  }

  // Keep the response same as we have from mms api. If llm generated
  // an aggregation, we want to return that instead of a query
  if (result.aggregation) {
    return {
      content: {
        aggregation: {
          pipeline: result.aggregation,
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
      aggregation: null,
      query: {
        filter: result.filter ?? null,
        project: result.project ?? null,
        sort: result.sort ?? null,
        skip: result.skip ?? null,
        limit: result.limit ?? null,
      },
    },
  };
}

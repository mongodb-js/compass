import type { Logger } from '@mongodb-js/compass-logging';

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
        // Here the value is valid js string, but not valid json, so we use eval to parse it.
        const tagValue = eval(`(${value})`);
        if (
          !tagValue ||
          (typeof tagValue === 'object' && Object.keys(tagValue).length === 0)
        ) {
          result[tag] = null;
        } else {
          result[tag] = JSON.stringify(tagValue);
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

  // Keep the response same as we have from mms api
  return {
    content: {
      ...(result.aggregation ? { aggregation: result.aggregation } : {}),
      query: {
        filter: result.filter,
        project: result.project,
        sort: result.sort,
        skip: result.skip,
        limit: result.limit,
      },
    },
  };
}

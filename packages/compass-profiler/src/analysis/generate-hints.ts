import { type Document } from 'bson';

function percentageOf(value: number, total: number): number {
  const ratio = value / total;
  const pcnt = ratio * 100;

  return Math.round(pcnt * 100) / 100;
}

export function compactBytes(bytes: number, si = true, decimals = 2): string {
  const threshold = si ? 1000 : 1024;
  if (bytes === 0) {
    return `${bytes} B`;
  }
  const units = si
    ? ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(threshold));
  const num = bytes / Math.pow(threshold, i);
  return `${num.toFixed(decimals)} ${units[i]}`;
}

export type HintType = 'success' | 'warning' | 'error' | 'info';

export type Hint = {
  type: HintType;
  description: string;
  moreInfoUrl?: string;
  queryShape: string;
};

export function gatherUniqueFieldsFromQuery(filter: Document): string[] {
  const result = new Set<string>();
  const keys = Object.keys(filter);
  for (const k of keys) {
    if (k.startsWith('$') && typeof filter[k] === 'object') {
      gatherUniqueFieldsFromQuery(filter[k]).forEach((f) => result.add(f));
    } else {
      result.add(k);
    }
  }

  return Array.from(result);
}

function fieldsFromIndex(indexDef: string): string[] {
  const indexDoc = eval(`(${indexDef})`);
  return Object.keys(indexDoc);
}

function inferIndexFromQuery(profiledQuery: Document): string {
  const filter = profiledQuery.command.filter;
  const fields = gatherUniqueFieldsFromQuery(filter);

  const result: any = {};
  fields.forEach((f) => (result[f] = 1));

  return JSON.stringify(result);
}

function findFieldsNotCoveredByIndex(
  profiledQuery: Document,
  indexDef: string
) {
  const indexFields = fieldsFromIndex(indexDef);
  const queryFields = gatherUniqueFieldsFromQuery(profiledQuery.command.filter);

  return queryFields.filter((field) => !indexFields.includes(field));
}

export function generateHints(
  profiledQuery: Document,
  totalWtCache: number,
  totalExecutionTime: number
): Hint[] {
  if (!profiledQuery || profiledQuery.op !== 'query') {
    return [];
  }

  const result: Hint[] = [];
  const queryShape = profiledQuery.queryHash;
  const totalQueryTime = profiledQuery.millis;
  const pcntOfTimeInQuery = percentageOf(totalQueryTime, totalExecutionTime);

  if (pcntOfTimeInQuery > 50) {
    result.push({
      type: 'error',
      description: `Your query took ${pcntOfTimeInQuery}% of the total execution time.`,
      queryShape,
    });
  }

  if (totalQueryTime > 100) {
    result.push({
      type: 'warning',
      description: `Your query took ${totalQueryTime}ms, taking more time than the slow query threshold of 100ms.`,
      queryShape,
    });
  }

  if (profiledQuery.planSummary === 'COLLSCAN') {
    const inferredIndex = inferIndexFromQuery(profiledQuery);
    result.push({
      type: 'error',
      description: `Your query is executing as a collection scan because there is no available index. You might want to create an index similar to ${inferredIndex}.`,
      queryShape,
    });
  }

  if (profiledQuery.planSummary.startsWith('IXSCAN')) {
    const indexDef = profiledQuery.planSummary.substring(6).trim();
    result.push({
      type: 'success',
      description: `Your query is using the index ${indexDef}`,
      queryShape,
    });

    if (profiledQuery.keysExamined === profiledQuery.nreturned) {
      result.push({
        type: 'success',
        description: `Your query is completely fulfilled by the index.`,
        queryShape,
      });
    } else {
      const fieldsNotCovered = findFieldsNotCoveredByIndex(
        profiledQuery,
        indexDef
      );
      result.push({
        type: 'warning',
        description: `Your query needs to filter documents in memory because the index is not specific enough. The following fields are currently not covered by the index: ${fieldsNotCovered.join(
          ', '
        )}`,
        queryShape,
      });
    }

    if (profiledQuery.nreturned > 0 && profiledQuery.docsExamined === 0) {
      result.push({
        type: 'success',
        description: `You are using a covered query.`,
      });
    } else if (
      profiledQuery.nreturned > 1000 &&
      profiledQuery.docsExamined > 0
    ) {
      result.push({
        type: 'warning',
        description: `Your query is returning a big amount of documents (${profiledQuery.nreturned}), you might want to use a covered query for this scenario.`,
        queryShape,
      });
    }
  }

  if (profiledQuery.storage?.data?.bytesRead) {
    const pcntOfCache = percentageOf(
      profiledQuery.storage?.data?.bytesRead,
      totalWtCache
    );
    if (pcntOfCache < 20) {
      result.push({
        type: 'warning',
        description: `This query needed to read around ${compactBytes(
          profiledQuery.storage?.data?.bytesRead
        )} from disk, being ${pcntOfCache}% of the total cache available for MongoDB.`,
        queryShape,
      });
    } else {
      result.push({
        type: 'error',
        description: `This query needed to read around ${compactBytes(
          profiledQuery.storage?.data?.bytesRead
        )} from disk, being ${pcntOfCache}% of the total cache available for MongoDB.`,
        queryShape,
      });
    }

    const diskTimeInMs =
      (profiledQuery.storage?.data?.timeReadingMicros || 0) / 1000;
    const pcntTimeInDisk = percentageOf(diskTimeInMs, profiledQuery.millis);

    if (pcntTimeInDisk > 10) {
      result.push({
        type: 'error',
        description: `Approximately ${pcntTimeInDisk}% of the query time was spent on disk. Your MongoDB cluster might be underprovisioned.`,
        queryShape,
      });
    }
  }

  return result;
}

export function generateGlobalHints(profiledQueries: Document[]): Hint[] {
  return [
    {
      type: 'info',
      description: 'Hey',
      queryShape: profiledQueries[0].queryHash,
    },
  ];
}

import { type Document } from 'bson';
import { toJSString } from 'mongodb-query-parser';
import { GlobalStats } from './generate-global-stats';

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
  attachedCode?: string;
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
      description: `Your query is executing as a collection scan because there is no available index. If the query is going to be consistently used, you might want to create an index similar to:`,
      queryShape,
      attachedCode: inferredIndex,
    });
  }

  if (profiledQuery.planSummary.startsWith('IXSCAN')) {
    const indexDef = profiledQuery.planSummary.substring(6).trim();
    if (profiledQuery.keysExamined === profiledQuery.nreturned) {
      result.push({
        type: 'success',
        description: `Your query is completely fulfilled by the index:`,
        queryShape,
        attachedCode: indexDef,
      });
    } else {
      const fieldsNotCovered = findFieldsNotCoveredByIndex(
        profiledQuery,
        indexDef
      );
      result.push({
        type: 'warning',
        description: `Your query needs to filter documents in memory because the index is not specific enough. The following fields are currently not covered by the index:`,
        queryShape,
        attachedCode: `${indexDef}\n// Fields not covered:\n${toJSString(
          fieldsNotCovered
        )}`,
      });
    }

    if (profiledQuery.nreturned > 0 && profiledQuery.docsExamined === 0) {
      result.push({
        type: 'success',
        description: `You are using a covered query with the following index:`,
        queryShape,
        attachedCode: indexDef,
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
        description: `Approximately ${pcntTimeInDisk}% of the query time was spent on disk.`,
        queryShape,
      });
    }
  }

  return result;
}

export function generateGlobalHints(
  profiledQueries: Document[],
  globalStats: GlobalStats
): Hint[] {
  const hints: Hint[] = [];
  let longestQuery: Document | undefined = undefined;
  let longestQueryTime: number = 0;
  let longestQueryInDisk: Document | undefined = undefined;
  let longestQueryInDiskTime: number = 0;
  let mostExpensiveInCpu: Document | undefined = undefined;
  let mostExpensiveInCpuTime: number = 0;
  let allCollScans: Document[] = [];
  let collScanShapes: Set<string> = new Set();

  for (const profiledQuery of profiledQueries) {
    if (!profiledQuery || profiledQuery.op !== 'query') {
      return [];
    }

    if (profiledQuery.millis > longestQueryTime) {
      longestQuery = profiledQuery;
      longestQueryTime = profiledQuery.millis;
    }

    if (
      profiledQuery.storage?.data?.timeReadingMicros > longestQueryInDiskTime
    ) {
      longestQueryInDisk = profiledQuery;
      longestQueryInDiskTime = profiledQuery.storage?.data?.timeReadingMicros;
    }

    if (
      profiledQuery.planSummary === 'COLLSCAN' &&
      !collScanShapes.has(profiledQuery.queryHash)
    ) {
      allCollScans.push(profiledQuery);
      collScanShapes.add(profiledQuery.queryHash);
    }

    if (profiledQuery.cpuNanos > mostExpensiveInCpuTime) {
      mostExpensiveInCpu = profiledQuery;
      mostExpensiveInCpuTime = profiledQuery.cpuNanos;
    }
  }

  if (longestQuery) {
    hints.push({
      description: `Your longest query took ${longestQueryTime}ms, being ${percentageOf(
        longestQueryTime,
        globalStats.totalTime
      )}% of all queries execution.`,
      queryShape: longestQuery.queryHash,
      type: 'info',
      attachedCode: toJSString(longestQuery.command.filter),
    });
  }

  if (mostExpensiveInCpu) {
    const pcnt = percentageOf(
      mostExpensiveInCpuTime / 1000 / 1000,
      globalStats.totalCpuMillis!
    );

    hints.push({
      description: `The most expensive query in CPU took ${pcnt}% of CPU time, and ${percentageOf(
        mostExpensiveInCpu.millis,
        globalStats.totalTime
      )}% of the total execution time.`,
      queryShape: mostExpensiveInCpu.queryHash,
      type: pcnt > 50 ? 'warning' : 'info',
      attachedCode: toJSString(mostExpensiveInCpu.command.filter),
    });
  }

  for (const collscan of allCollScans) {
    hints.push({
      description: `The following query is doing a collection scan, loading all documents into memory. You might want to fix this issue with an index, if the query is consistently used:`,
      queryShape: collscan.queryHash,
      type: 'error',
      attachedCode: `${toJSString(
        collscan.command.filter
      )}\n// Possible index:\n${inferIndexFromQuery(collscan)}`,
    });
  }

  if (longestQueryInDisk) {
    hints.push({
      description: `The following query is the most expensive in disk usage, taking ${Math.round(
        longestQueryInDiskTime / 1000
      )}ms.`,
      queryShape: longestQueryInDisk.queryHash,
      type: 'warning',
      attachedCode: `${toJSString(longestQueryInDisk.command.filter)}`,
    });
  }

  return hints;
}

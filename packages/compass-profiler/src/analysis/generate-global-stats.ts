import type { Document } from 'bson';

export type GlobalStats = {
  totalTime: number;
  cacheEfficiency: number;
  timeSpentOnDisk: number;
  indexAccuracy: number;
  totalCpuMillis?: number;
  cpuTimePercentage?: number;
};

export default function generateGlobalStats(
  profiledQueries: Document[],
  totalWtCache: number,
  queryHash?: string
): GlobalStats {
  let totalExecutionTime: number = 0;
  let totalDocumentsExamined: number = 0;
  let totalKeysExamined: number = 0;
  let totalTimeSpentOnDisk: number = 0;
  let totalBytesReadFromDisk: number = 0;
  let totalDocumentsReturned: number = 0;
  let queryCount: number = 0;
  let overallCpuUsage: number = 0;

  for (const profileItem of profiledQueries) {
    if (!profileItem || profileItem.op !== 'query') {
      continue;
    }

    if (queryHash && profileItem.queryHash !== queryHash) {
      continue;
    }

    totalExecutionTime += profileItem.millis;
    totalDocumentsExamined += profileItem.docsExamined;
    totalKeysExamined += profileItem.keysExamined;
    totalTimeSpentOnDisk += +(
      profileItem.storage?.data?.timeReadingMicros || 0
    );
    totalBytesReadFromDisk += +(profileItem.storage?.data?.bytesRead || 0);
    totalDocumentsReturned += +(profileItem.nreturned || 0);
    overallCpuUsage += profileItem.cpuNanos;

    queryCount += 1;
  }

  const cpuMillis = overallCpuUsage / 1000 / 1000;
  const indexAccuracy =
    totalKeysExamined > 0
      ? Math.abs((totalDocumentsReturned / totalKeysExamined) * 100)
      : 0;
  const avgCacheAvailableForQuery = totalWtCache / queryCount;
  const avgCacheReadIntoForQuery = totalBytesReadFromDisk / queryCount;
  const avgCacheUsage = avgCacheReadIntoForQuery / avgCacheAvailableForQuery;
  const avgCacheEfficiency = Math.abs(1 - avgCacheUsage);
  const cacheEfficiency = Math.round(avgCacheEfficiency * 100 * 100) / 100;

  totalTimeSpentOnDisk /= 1000;

  const totalTimeSpentOnDiskPcnt =
    (totalTimeSpentOnDisk / totalExecutionTime) * 100;
  const timeSpentOnDisk = Math.min(totalTimeSpentOnDiskPcnt, 100);
  const cpuTimePercentage =
    Math.round((cpuMillis / totalExecutionTime) * 100) / 100;

  return {
    totalTime: totalExecutionTime,
    cacheEfficiency: Math.min(cacheEfficiency, 100),
    indexAccuracy: Math.min(indexAccuracy, 100),
    timeSpentOnDisk: isFinite(timeSpentOnDisk) ? timeSpentOnDisk : 0,
    totalCpuMillis:
      cpuMillis === 0 ? undefined : isFinite(cpuMillis) ? cpuMillis : 0,
    cpuTimePercentage:
      cpuMillis === 0
        ? undefined
        : isFinite(cpuTimePercentage)
        ? cpuTimePercentage
        : 0,
  };
}

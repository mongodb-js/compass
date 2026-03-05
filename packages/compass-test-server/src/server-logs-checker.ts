import type { MongoClusterEvents, LogEntry } from 'mongodb-runner';
import { type MongoCluster } from 'mongodb-runner';

/**
 * Filter for allowing specific server warnings.
 * Can be a numeric log ID or a predicate function.
 */
export type WarningFilter = number | ((entry: LogEntry) => boolean);

const DEFAULT_ALLOWED_WARNINGS: WarningFilter[] = [
  2658100, // "Hinted index could not provide a bounded scan, reverting to whole index scan"
  4615610, // "Failed to check socket connectivity",
  20526, // "Failed to gather storage statistics for slow operation"
  (l: LogEntry) => {
    // "Use of deprecated server parameter name" (FTDC)
    return (l.id === 636300 || l.id === 23803) && l.context === 'ftdc';
  },
  (l: LogEntry) => {
    // "Aggregate command executor error"
    if (l.id === 23799) {
      console.log('Aggregate command executor error', l.attr.error);
    }
    if (l.id === 23798 || l.id === 7267501) {
      console.log('Plan executor error', l.id, l.attr.error);
    }
    return (
      l.id === 23799 &&
      ['NamespaceNotFound', 'CommandNotSupportedOnView'].includes(
        l.attr?.error?.codeName
      )
    );
  },
];

/**
 * Monitors MongoDB server logs and validates that no unexpected warnings occur.
 * Modeled after the mongosh implementation in PR #2574.
 */
export class ServerLogsChecker {
  private collectedWarnings: LogEntry[] = [];
  private warningFilters: ((entry: LogEntry) => boolean)[] = [];
  private listener: (serverUUID: string, entry: LogEntry) => void;
  private cluster: MongoCluster;

  constructor(cluster: MongoCluster) {
    this.cluster = cluster;
    this.listener = (_serverUUID: string, entry: LogEntry) => {
      // Only collect warnings (W), errors (E), and fatal (F) severity logs
      // Apply filters at collection time - filtered warnings are never stored
      if (
        (entry.severity === 'W' ||
          entry.severity === 'E' ||
          entry.severity === 'F') &&
        !this.warningFilters.some((filter) => filter(entry))
      ) {
        this.collectedWarnings.push(entry);
      }
    };

    // Add default warning filters
    for (const filter of DEFAULT_ALLOWED_WARNINGS) {
      this.allowWarning(filter);
    }

    // Subscribe to mongoLog events
    this.cluster.on(
      'mongoLog',
      this.listener as MongoClusterEvents['mongoLog'] extends (
        ...args: infer A
      ) => void
        ? (...args: A) => void
        : never
    );
  }

  /**
   * Get a copy of the collected warnings.
   */
  get warnings(): LogEntry[] {
    return [...this.collectedWarnings];
  }

  /**
   * Allow a specific warning to pass validation.
   * Must be called BEFORE the warning occurs (filters are applied at collection time).
   * @param filter - A log ID (number) or predicate function
   * @returns A function to unsubscribe this filter
   */
  allowWarning(filter: WarningFilter): () => void {
    const filterFn =
      typeof filter === 'number'
        ? (entry: LogEntry) => entry.id === filter
        : filter;

    this.warningFilters.push(filterFn);
    return () => {
      const index = this.warningFilters.indexOf(filterFn);
      if (index !== -1) {
        this.warningFilters.splice(index, 1);
      }
    };
  }

  /**
   * Check for unexpected warnings and throw if any are found.
   * Clears the collected warnings after checking.
   */
  noServerWarningsCheckpoint(): void {
    const warnings = this.warnings;
    this.collectedWarnings = [];

    if (warnings.length > 0) {
      const warningDetails = warnings
        .map((w) => `  - [${w.severity}] ID:${w.id ?? 'unknown'} ${w.message}`)
        .join('\n');
      throw new Error(
        `Unexpected server warnings detected:\n${warningDetails}`
      );
    }
  }

  /**
   * Stop listening to log events.
   */
  close(): void {
    this.cluster.off(
      'mongoLog',
      this.listener as MongoClusterEvents['mongoLog'] extends (
        ...args: infer A
      ) => void
        ? (...args: A) => void
        : never
    );
  }
}

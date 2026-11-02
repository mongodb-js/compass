import convertExplainCompat from 'mongodb-explain-compat';
import { getPlannerInfo } from './get-planner-info';
import { getExecutionStats } from './get-execution-stats';
import type { ExecutionStats } from './get-execution-stats';
import { getStageIndexFields } from './utils';

const kParent = Symbol('ExplainPlan.kParent');

export type Stage = Record<string, any> & {
  stage: string;
  [kParent]: Stage | null;
};
export type IndexInformation = { fields: Record<string, unknown> } & (
  | { shard: string; index: string }
  | { shard: string; index: null }
  | { shard: null; index: string }
);

type IndexEntry = { fields?: Record<string, unknown> } & (
  | {
      index: string;
      shard: string | null;
      stage: Stage | null;
    }
  | { index: null; shard: string; stage: null }
);

export type SerializedExplainPlan = Pick<
  ExplainPlan,
  | 'namespace'
  | 'parsedQuery'
  | 'executionSuccess'
  | 'nReturned'
  | 'executionTimeMillis'
  | 'totalKeysExamined'
  | 'totalDocsExamined'
  | 'originalExplainData'
  | 'executionStats'
  | 'isCovered'
  | 'isMultiKey'
  | 'inMemorySort'
  | 'isCollectionScan'
  | 'isSharded'
  | 'numShards'
  | 'indexType'
> & { usedIndexes: IndexInformation[] };

export class ExplainPlan {
  namespace: string;
  parsedQuery: Stage;
  executionSuccess: boolean;
  nReturned: number | null;
  executionTimeMillis: number | null;
  totalKeysExamined: number | null;
  totalDocsExamined: number | null;
  originalExplainData: Stage;
  executionStats?: ExecutionStats;
  winningPlan: Stage;

  constructor(originalExplainData: Stage) {
    const rawExplainObject = convertExplainCompat(originalExplainData);
    const executionStats = getExecutionStats(rawExplainObject);
    if (executionStats?.executionStages) {
      ExplainPlan.addParentStages(executionStats.executionStages);
    }
    const qpInfo = getPlannerInfo(rawExplainObject);
    const esInfo =
      executionStats?.executionStages?.shards?.[0] ?? executionStats;
    this.executionStats = executionStats;
    this.namespace = qpInfo.namespace;
    this.parsedQuery = qpInfo.parsedQuery;
    this.executionSuccess = esInfo?.executionSuccess ?? false;
    this.nReturned = executionStats?.nReturned ?? null;
    this.executionTimeMillis = executionStats?.executionTimeMillis ?? null;
    this.totalKeysExamined = executionStats?.totalKeysExamined ?? null;
    this.totalDocsExamined = executionStats?.totalDocsExamined ?? null;
    this.originalExplainData = originalExplainData;
    this.winningPlan = qpInfo.winningPlan;
  }

  private _getIndexEntries(): IndexEntry[] {
    const ixscan = this.findAllStagesByName('IXSCAN');
    const expressIxscan = this.findAllStagesByName('EXPRESS_IXSCAN');
    const countScan = this.findAllStagesByName('COUNT_SCAN');
    // special case for IDHACK stage, using the _id_ index.
    const idhack = this.findStageByName('IDHACK');
    const ret: IndexEntry[] = (this.executionStats?.stageIndexes ?? []).map(
      (indexInfo) => ({
        ...indexInfo,
        stage: null,
      })
    );
    for (const stage of [...ixscan, ...expressIxscan, ...countScan, idhack]) {
      if (!stage) continue;
      let shard: string | null = null;
      if (this.isSharded) {
        for (const parent of ExplainPlan.getParentStages(stage)) {
          if (typeof parent.shardName === 'string') {
            shard = parent.shardName;
            break;
          }
        }
      }
      ret.push(
        stage === idhack
          ? { index: '_id_', shard, stage: null, fields: { _id: 1 } }
          : { index: stage.indexName, shard, stage }
      );
    }
    if (this.isSharded) {
      for (const shard of this.executionStats?.executionStages?.shards ?? []) {
        if (!ret.some((entry) => entry.shard === shard.shardName)) {
          ret.push({ index: null, shard: shard.shardName, stage: null });
        }
      }
    }
    return ret.filter(
      (entry, index, arr) =>
        arr.findIndex(
          (i) => i.index === entry.index && i.shard === entry.shard
        ) === index
    );
  }

  async getUsedIndexes(): Promise<IndexInformation[]> {
    const usedIndexes: IndexInformation[] = [];
    for (const entry of this._getIndexEntries()) {
      const fields =
        entry.fields ??
        (entry.stage ? await getStageIndexFields(entry.stage) : {});
      if (entry.index === null) {
        usedIndexes.push({ index: null, shard: entry.shard, fields });
      } else {
        usedIndexes.push({ index: entry.index, shard: entry.shard, fields });
      }
    }
    return usedIndexes;
  }

  get isCovered(): boolean {
    // @todo (thomas) implement for sharded explain plans
    if (this.totalDocsExamined && this.totalDocsExamined > 0) {
      return false;
    }
    const ixscan = this.findStageByName('IXSCAN');
    const expressIxscan = this.findStageByName('EXPRESS_IXSCAN');
    const stage = ixscan || expressIxscan;
    return stage?.parentName !== 'FETCH';
  }

  get isMultiKey(): boolean {
    return this.findAllStagesByName('IXSCAN').some((stage) => stage.isMultiKey);
  }

  get inMemorySort(): boolean {
    return this.findAllStagesByName('SORT').length !== 0;
  }

  get isCollectionScan(): boolean {
    return this.findStageByName('COLLSCAN') !== null;
  }

  get isSharded(): boolean {
    return !!this.executionStats?.executionStages?.shards;
  }

  get numShards(): number {
    return this.isSharded
      ? this.executionStats?.executionStages?.shards.length
      : 0;
  }

  get isClusteredScan(): boolean {
    return Boolean(
      this.findStageByName('EXPRESS_CLUSTERED_IXSCAN') ||
      this.findStageByName('CLUSTERED_IXSCAN')
    );
  }

  get indexType() {
    const indexes = this._getIndexEntries();

    // Currently the CLUSTERED_IXSCAN and EXPRESS_CLUSTERED_IXSCAN do not report
    // any indexes in the winning stage. Even though the query clearly uses
    // an index. And since we can't determine the index used, we will return CLUSTER.
    if (this.isClusteredScan) {
      return 'CLUSTERED';
    }

    if (indexes.length === 0) {
      return 'UNAVAILABLE';
    }

    const indexInfoByShard = indexes.reduce(
      (acc, index) => {
        if (index.shard) {
          acc[index.shard] ??= [];
          acc[index.shard].push(index.index);
        }
        return acc;
      },
      {} as Record<string, (string | null)[]>
    );

    const indexNamesForAllShards = Object.values(indexInfoByShard);

    for (let i = 0; i < indexNamesForAllShards.length; i++) {
      for (let j = i + 1; j < indexNamesForAllShards.length; j++) {
        if (
          indexNamesForAllShards[i].length !==
            indexNamesForAllShards[j].length ||
          indexNamesForAllShards[i].some(
            (val, idx) => val !== indexNamesForAllShards[j][idx]
          )
        ) {
          return 'MULTIPLE'; // As in, multiple index setups that differ between shards
        }
      }
    }

    if (this.isCollectionScan) {
      return 'COLLSCAN';
    }

    if (this.isCovered) {
      return 'COVERED';
    }

    return 'INDEX';
  }

  /**
   * Walks the tree of execution stages from a given node (or root) and returns
   * the first stage with the specified name, or null if no stage is found.
   * Equally-named children stage are traversed and returned in order.
   * Returns null if legacyMode is true.
   *
   * @param  {String} name   - name of stage to return
   * @param  {Object} root   - stage to start from. If unspecified, start from
   *                           executionStages root node.
   * @return {Object|null}   - stage object or null
   */
  findStageByName(name: string, root?: Stage): Stage | null {
    for (const stage of this._getStageIterator(root)) {
      if (stage.stage === name) {
        return stage;
      }
    }
    return null;
  }

  /**
   * Walks the tree of execution stages from a given node (or root) and returns
   * an array of all stages with the specified name, or null if no stage is found.
   * Returns null if legacyMode is true.
   *
   * @param  {String} name   - name of stage to return
   * @param  {Object} root   - stage to start from. If unspecified, start from
   *                           executionStages root node.
   * @return {Array}         - array of matching stage objects
   */
  findAllStagesByName(name: string, root?: Stage): Stage[] {
    return [...this._getStageIterator(root)].filter(
      (stage) => stage.stage === name
    );
  }

  /** DFS stack iterator implementation */
  *_getStageIterator(root?: Stage): Iterable<Stage> {
    const stage =
      root ?? this.executionStats?.executionStages ?? this.winningPlan;

    if (!stage) {
      return;
    }

    yield stage;
    for (const child of ExplainPlan.getChildStages(stage)) {
      yield* this._getStageIterator(child);
    }
  }

  async serialize(): Promise<SerializedExplainPlan> {
    const usedIndexes = await this.getUsedIndexes();
    return JSON.parse(
      JSON.stringify({
        namespace: this.namespace,
        parsedQuery: this.parsedQuery,
        executionSuccess: this.executionSuccess,
        nReturned: this.nReturned,
        executionTimeMillis: this.executionTimeMillis,
        totalKeysExamined: this.totalKeysExamined,
        totalDocsExamined: this.totalDocsExamined,
        originalExplainData: this.originalExplainData,
        executionStats: this.executionStats,
        usedIndexes,
        isCovered: this.isCovered,
        isMultiKey: this.isMultiKey,
        inMemorySort: this.inMemorySort,
        isCollectionScan: this.isCollectionScan,
        isSharded: this.isSharded,
        numShards: this.numShards,
        indexType: this.indexType,
      })
    );
  }

  /**
   * Returns child stage or stages of current stage as array. If there are
   * no more child stages, returns empty array []. Also works for sharded
   * explain plans (where shards are children). Not supported for legacy mode.
   *
   * @param  {Object} stage   - stage to get children of.
   * @return {Array}          - array of child stages.
   */
  static *getChildStages(stage?: Stage): Iterable<Stage> {
    if (!stage) {
      return;
    }

    if (stage.inputStage) {
      yield stage.inputStage;
    }
    if (stage.executionStages) {
      yield stage.executionStages;
    }
    if (stage.innerStage) {
      yield stage.innerStage;
    }
    if (stage.outerStage) {
      yield stage.outerStage;
    }
    if (stage.thenStage) {
      yield stage.thenStage;
    }
    if (stage.elseStage) {
      yield stage.elseStage;
    }
    if (stage.shards) {
      yield* stage.shards;
    }
    if (stage.inputStages) {
      yield* stage.inputStages;
    }
  }

  /**
   * Recursively add a hidden property to all child stages
   * that points to the parent, or `null` for the root stage.
   * The list of parents can be iterated via getParentStages().
   */
  static addParentStages(stage: Stage): void {
    stage[kParent] = null;
    for (const child of ExplainPlan.getChildStages(stage)) {
      ExplainPlan.addParentStages(child);
      child[kParent] = stage;
    }
  }

  /**
   * Iterator over all parent stages of a stage. Only works if
   * ExplainPlan.addParentStages() has been called on a parent stage
   * first. Does not yield the stage itself.
   */
  static *getParentStages(stage: Stage): Iterable<Stage> {
    let current: Stage | null = stage;
    while ((current = current?.[kParent])) {
      yield current;
    }
  }
}

import convertExplainCompat from 'mongodb-explain-compat';
import { getPlannerInfo } from './get-planner-info';
import { getExecutionStats } from './get-execution-stats';
import type { ExecutionStats } from './get-execution-stats';

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

  get usedIndexes(): IndexInformation[] {
    const ixscan = this.findAllStagesByName('IXSCAN');
    // special case for IDHACK stage, using the _id_ index.
    const idhack = this.findStageByName('IDHACK');
    const ret: IndexInformation[] = this.executionStats?.stageIndexes ?? [];
    for (const stage of [...ixscan, idhack]) {
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
      const index: string = stage === idhack ? '_id_' : stage.indexName;
      const fields = stage === idhack ? { _id: 1 } : stage.keyPattern ?? {};
      ret.push({ index, shard, fields });
    }
    if (this.isSharded) {
      for (const shard of this.executionStats?.executionStages?.shards) {
        if (!ret.some((indexInfo) => indexInfo.shard === shard.shardName)) {
          ret.push({ index: null, shard: shard.shardName, fields: {} });
        }
      }
    }
    return ret.filter(
      (indexInfo, index, arr) =>
        arr.findIndex(
          (i) => i.index === indexInfo.index && i.shard === indexInfo.shard
        ) === index
    );
  }

  get isCovered(): boolean {
    // @todo (thomas) implement for sharded explain plans
    if (this.totalDocsExamined && this.totalDocsExamined > 0) {
      return false;
    }
    const ixscan = this.findStageByName('IXSCAN');
    return ixscan?.parentName !== 'FETCH';
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

  get indexType() {
    const indexes = this.usedIndexes;

    if (indexes.length === 0) {
      return 'UNAVAILABLE';
    }

    const indexInfoByShard = indexes.reduce((acc, index) => {
      if (index.shard) {
        acc[index.shard] ??= [];
        acc[index.shard].push(index.index);
      }
      return acc;
    }, {} as Record<string, (string | null)[]>);

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

  serialize(): Pick<
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
    | 'usedIndexes'
    | 'isCovered'
    | 'isMultiKey'
    | 'inMemorySort'
    | 'isCollectionScan'
    | 'isSharded'
    | 'numShards'
    | 'indexType'
  > {
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
        usedIndexes: this.usedIndexes,
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

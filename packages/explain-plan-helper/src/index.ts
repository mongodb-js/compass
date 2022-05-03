import convertExplainCompat from 'mongodb-explain-compat';

const kParent = Symbol('ExplainPlan.kParent');

type Stage = Record<string, any> & { stage: string; [kParent]: Stage | null };
type IndexInformation =
  | { shard: string; index: string }
  | { shard: string; index: null }
  | { shard: null; index: string };
type ExecutionStats = {
  executionSuccess: boolean;
  nReturned: number;
  executionTimeMillis: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  executionStages: Stage;
  allPlansExecution: unknown[];
}

function isAggregationExplain(rawExplain: Stage) {
  return !!rawExplain.stages;
}

/**
 * https://wiki.corp.mongodb.com/display/QUERY/Explain+Notes
 */
function getQueryPlannerAndStats(rawExplain: Stage) {
  if (!isAggregationExplain(rawExplain)) {
    return {
      queryPlanner: rawExplain.queryPlanner,
      executionStats: rawExplain.executionStats,
    };
  }

  const firstStage = rawExplain.stages[0];
  const lastStage = rawExplain.stages[rawExplain.stages.length - 1];
  const firstStageKey = Object.keys(firstStage)[0]; // $cursor || $geoNearCursor ...
  if (!firstStageKey.matchAll(/cursor/ig)) {
    throw new Error('Can not find a cursor stage.');
  }
  const { queryPlanner, executionStats } = firstStage[firstStageKey];
  executionStats.nReturned = lastStage.nReturned;
  executionStats.executionTimeMillis = rawExplain.stages.reduce((x: any, acc: number) => {
    return acc + (x.executionTimeMillisEstimate as number);
  }, 0);
  return {
    queryPlanner,
    executionStats,
  };
}

export class ExplainPlan {
  namespace: string;
  parsedQuery: Stage;
  executionSuccess: boolean;
  nReturned: number;
  executionTimeMillis: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  originalExplainData: Stage;
  executionStats: ExecutionStats;

  constructor(originalExplainData: Stage) {
    const rawExplainObject = convertExplainCompat(originalExplainData);
    const { executionStats, queryPlanner } = getQueryPlannerAndStats(rawExplainObject);
    ExplainPlan.addParentStages(executionStats.executionStages);
    const qpInfo = queryPlanner?.winningPlan?.shards?.[0] ?? queryPlanner;
    const esInfo =
      executionStats?.executionStages?.shards?.[0] ??
      executionStats;
    this.executionStats = executionStats;
    this.namespace = qpInfo.namespace;
    this.parsedQuery = qpInfo.parsedQuery;
    this.executionSuccess = esInfo.executionSuccess;
    this.nReturned = executionStats.nReturned;
    this.executionTimeMillis = executionStats.executionTimeMillis;
    this.totalKeysExamined = executionStats.totalKeysExamined;
    this.totalDocsExamined = executionStats.totalDocsExamined;
    this.originalExplainData = originalExplainData;
  }

  get usedIndexes(): IndexInformation[] {
    const ixscan = this.findAllStagesByName('IXSCAN');
    // special case for IDHACK stage, using the _id_ index.
    const idhack = this.findStageByName('IDHACK');
    const ret: IndexInformation[] = [];
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
      ret.push({ index, shard });
    }
    if (this.isSharded) {
      for (const shard of this.executionStats.executionStages.shards) {
        if (!ret.some((indexInfo) => indexInfo.shard === shard.shardName)) {
          ret.push({ index: null, shard: shard.shardName });
        }
      }
    }
    return ret;
  }

  get isCovered(): boolean {
    // @todo (thomas) implement for sharded explain plans
    if (this.totalDocsExamined > 0) {
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
    return !!this.executionStats.executionStages.shards;
  }

  get numShards(): number {
    return this.isSharded
      ? this.executionStats.executionStages.shards.length
      : 0;
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
    const stage = root ?? this.executionStats.executionStages;

    yield stage;
    for (const child of ExplainPlan.getChildStages(stage)) {
      yield* this._getStageIterator(child);
    }
  }

  /**
   * Returns child stage or stages of current stage as array. If there are
   * no more child stages, returns empty array []. Also works for sharded
   * explain plans (where shards are children). Not supported for legacy mode.
   *
   * @param  {Object} stage   - stage to get children of.
   * @return {Array}          - array of child stages.
   */
  static *getChildStages(stage: Stage): Iterable<Stage> {
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

import convertExplainCompat from 'mongodb-explain-compat';

type Stage = Record<string, any> & { stage: string };

export class ExplainPlan {
  namespace: string;
  parsedQuery: Stage;
  executionSuccess: boolean;
  nReturned: number;
  executionTimeMillis: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  rawExplainObject: Stage;
  originalExplainData: Stage;

  constructor(originalExplainData: Stage) {
    const rawExplainObject = convertExplainCompat(originalExplainData);
    const qpInfo =
      rawExplainObject.queryPlanner?.winningPlan?.shards?.[0] ??
      rawExplainObject.queryPlanner;
    const esInfo =
      rawExplainObject.executionStats?.executionStages?.shards?.[0] ??
      rawExplainObject.executionStats;
    this.namespace = qpInfo.namespace;
    this.parsedQuery = qpInfo.parsedQuery;
    this.executionSuccess = esInfo.executionSuccess;
    this.nReturned = rawExplainObject.executionStats.nReturned;
    this.executionTimeMillis =
      rawExplainObject.executionStats.executionTimeMillis;
    this.totalKeysExamined = rawExplainObject.executionStats.totalKeysExamined;
    this.totalDocsExamined = rawExplainObject.executionStats.totalDocsExamined;
    this.rawExplainObject = rawExplainObject;
    this.originalExplainData = originalExplainData;
  }

  get usedIndex(): string[] | string | null {
    const ixscan = this.findAllStagesByName('IXSCAN');
    const names = [...new Set(ixscan.map((stage) => stage.indexName))];
    // special case for IDHACK stage, using the _id_ index.
    const idhack = this.findStageByName('IDHACK');
    // if not all shards use an index, add `null` to the array
    if (ixscan.length < this.numShards) {
      names.push(idhack ? '_id_' : null);
    }
    if (names.length === 1) {
      return names[0];
    }
    if (names.length > 1) {
      return names;
    }
    return idhack ? '_id_' : null;
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
    return !!this.rawExplainObject.executionStats.executionStages.shards;
  }

  get numShards(): number {
    return this.isSharded
      ? this.rawExplainObject.executionStats.executionStages.shards.length
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
    const stage = root ?? this.rawExplainObject.executionStats.executionStages;

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
}

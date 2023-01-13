import type { DataService } from 'mongodb-data-service';
import * as t from '@babel/types';
import type { Document } from 'bson';
import { PipelinePreviewManager } from './pipeline-preview-manager';
import type { PreviewOptions } from './pipeline-preview-manager';
import { PipelineParser } from './pipeline-parser';
import Stage from './stage';
import { parseShellBSON, PipelineParserError } from './pipeline-parser/utils';
import { prettify } from './pipeline-parser/utils';
import { isLastStageOutputStage } from '../../utils/stage';

export const DEFAULT_PIPELINE = `[]`;

// For stages we use real stage id to store pipeline fetching abort controller
// reference in the queue. For whole pipeline we use special, otherwise
// unreachable number, to store the reference
const FULL_PIPELINE_PREVIEW_ID = Infinity;

export class PipelineBuilder {
  source: string = DEFAULT_PIPELINE;
  private _node: t.ArrayExpression | null = null;
  /* Pipeline representation of parsable source */
  private _pipeline: Document[] | null = null;
  private _syntaxError: PipelineParserError[] = [];
  private _stages: Stage[] = [];
  // todo: make private COMPASS-6167
  previewManager: PipelinePreviewManager;

  constructor(dataService: DataService, source = DEFAULT_PIPELINE) {
    this.previewManager = new PipelinePreviewManager(dataService);
    this.changeSource(source);
    this.sourceToStages();
  }

  /**
   * To avoid checking for the source emptiness everywhere in the builder and UI
   * code, and because no source is technically a broken code that can't be
   * meaningfully parsed we use this method to provide special getters for all
   * values derived from the pipeline source: if source is an empty string, then
   * node, parsed pipeline, and syntax errors returned by this class will match
   * the state of an empty pipeline (an empty array)
   */
  private isEmptySource() {
    return this.source.trim() === '';
  }

  get node() {
    return this.isEmptySource() ? t.arrayExpression() : this._node;
  }

  set node(val: typeof this._node) {
    this._node = val;
  }

  get pipeline() {
    return this.isEmptySource() ? [] : this._pipeline;
  }

  set pipeline(val: typeof this._pipeline) {
    this._pipeline = val;
  }

  get syntaxError() {
    return this.isEmptySource() ? [] : this._syntaxError;
  }

  set syntaxError(val: typeof this._syntaxError) {
    this._syntaxError = val;
  }

  get stages() {
    return this.isEmptySource() ? [] : this._stages
  }

  set stages(val: typeof this._stages) {
    this._stages = val;
  }

  // COMPASS-6319: We deliberately ignore all empty stages for all operations
  // related to parsing / generating / validating pipeline. This does mean that
  // we lose user input in some cases, but we consider this acceptable
  private get nonEmptyStages() {
    return this.stages.filter((stage) => !stage.isEmpty);
  }

  private parseSourceToPipeline() {
    try {
      this.pipeline = parseShellBSON(this.source);
      // parseShellBSON will parse various values, not all of them are valid
      // aggregation pipelines
      if (!Array.isArray(this.pipeline)) {
        throw new Error('Pipeline should be an array');
      }
    } catch (e) {
      this.pipeline = null;
    }
  }

  /**
   * Completely reset pipeline state with provided source
   */
  reset(source = DEFAULT_PIPELINE) {
    this.pipeline = [];
    this.stages = [];
    this.syntaxError = [];
    this.changeSource(source);
    this.sourceToStages();
  }

  /**
   * Change the pipeline source and validate it
   */
  changeSource(source: string): void {
    this.source = source;
    this.parseSourceToPipeline();
    this.validateSource();
  }

  /**
   * Generate stages from current source
   */
  sourceToStages(): void {
    try {
      const { root, stages } = PipelineParser.parse(this.source);
      this.node = root;
      this.stages = stages.map((node) => {
        return new Stage(node);
      });
      this.syntaxError = this.stages
        .map((stage) => stage.syntaxError)
        .filter(Boolean) as PipelineParserError[];
    } catch (e) {
      this.syntaxError = [e as PipelineParserError];
    }
  }

  /**
   * Validate current pipeline source (this is cheaper than generating stages
   * from source to validate source)
   */
  private validateSource(): void {
    const { root, errors } = PipelineParser.validate(this.source);
    this.node = root;
    this.syntaxError = errors;
  }

  /**
   * Parse current pipeline source to runnable pipeline. Will throw if pipeline
   * contains errors
   */
  getPipelineFromSource(): Document[] {
    if (this.syntaxError.length > 0) {
      throw this.syntaxError[0];
    }
    if (this.pipeline === null) {
      throw new PipelineParserError('Invalid pipeline');
    }
    return this.pipeline;
  }

  /**
   * Generate pipeline source from stages and update current pipeline source
   */
  stagesToSource(): void {
    if (!this.node) {
      throw new Error(
        'Trying to generate source from stages with invalid pipeline'
      );
    }
    this.changeSource(PipelineParser.generate(this.node, this.nonEmptyStages));
  }

  /**
   * Get stage at index
   */
  getStage(idx: number): Stage {
    return this.stages[idx];
  }

  /**
   * Add new empty stage after provided index (by default adds new stage at the
   * end of the stages list)
   */
  addStage(after: number = this.stages.length - 1): Stage {
    const stage = new Stage();
    this.stages.splice(after + 1, 0, stage);
    return stage;
  }

  /**
   * Remove stage at index
   */
  removeStage(at: number): Stage {
    const stage = this.stages.splice(at, 1);
    return stage[0];
  }

  /**
   * Move stage from one index to another
   */
  moveStage(from: number, to: number): Stage {
    const stage = this.stages.splice(from, 1)[0];
    this.stages.splice(to, 0, stage);
    return stage;
  }

  /**
   * Returns current pipeline stages as string. Throws if stages contain syntax
   * errors
   */
  getPipelineStringFromStages(stages = this.nonEmptyStages): string {
    const code = `[${stages.map((stage) => stage.toString()).join(',\n')}\n]`;
    // We don't care if disabled stages have errors because they will be
    // converted to commented out code anyway, but we will not be able to
    // prettify the code if some stages contain syntax errors
    const enabledStageWithError = stages.find(
      (stage) => !stage.disabled && stage.syntaxError
    );
    if (enabledStageWithError) {
      return code;
    }
    return prettify(code);
  }

  /**
   * Returns current source of the pipeline
   */
  getPipelineStringFromSource(): string {
    // Can't prettify a string when it contains syntax errors
    if (this.syntaxError.length > 0) {
      return this.source;
    }
    return prettify(this.source);
  }

  /**
   * Get runnable pipeline from current pipeline stages. Will throw if pipeline
   * contains errors
   */
  getPipelineFromStages(stages = this.nonEmptyStages): Document[] {
    return parseShellBSON(this.getPipelineStringFromStages(stages));
  }

  /**
   * Cancel preview requests that are currently inflight starting from index
   */
  stopPreview(from?: number): void {
    this.previewManager.clearQueue(from);
  }

  /**
   * Cancel preview for a specific stage at index
   */
  cancelPreviewForStage(id: number): void {
    this.previewManager.cancelPreviewForStage(id);
  }

  /**
   * Cancel preview for the whole pipeline
   */
  cancelPreviewForPipeline() {
    this.cancelPreviewForStage(FULL_PIPELINE_PREVIEW_ID);
  }

  /**
   * Request preview documents for pipeline stage at provided index
   */
  getPreviewForStage(
    idx: number,
    namespace: string,
    options: PreviewOptions,
    force = false
  ): Promise<Document[]> {
    return this.previewManager.getPreviewForStage(
      idx,
      namespace,
      this.getPipelineFromStages(this.stages.slice(0, idx + 1)),
      options,
      force
    );
  }

  /**
   * Returns true if previous preview request was done for the same pipeline for
   * a specific stage
   */
  isLastStagePreviewEqual(
    idx: number,
    pipeline: Document[] = this.getPipelineFromStages(
      this.stages.slice(0, idx + 1)
    )
  ) {
    return this.previewManager.isLastPipelineEqual(idx, pipeline);
  }

  /**
   * Request preview for current pipeline source
   */
  getPreviewForPipeline(
    namespace: string,
    options: PreviewOptions,
    filterOutputStage = false
  ): Promise<Document[]> {
    // For preview we ignore $out/$merge stage.
    const pipeline = [...this.getPipelineFromSource()];
    if (filterOutputStage && isLastStageOutputStage(pipeline)) {
      pipeline.pop();
    }
    return this.previewManager.getPreviewForStage(
      FULL_PIPELINE_PREVIEW_ID,
      namespace,
      pipeline,
      options
    );
  }

  /**
   * Returns true if previous preview request was done for the same pipeline for
   * the whole pipeline
   */
  isLastPipelinePreviewEqual(
    pipeline: Document[] = this.getPipelineFromSource(),
    filterOutputStage = false
  ) {
    pipeline = [...pipeline];
    // For preview we ignore $out/$merge stage.
    if (filterOutputStage && isLastStageOutputStage(pipeline)) {
      pipeline.pop();
    }
    return this.previewManager.isLastPipelineEqual(
      FULL_PIPELINE_PREVIEW_ID,
      pipeline
    );
  }
}

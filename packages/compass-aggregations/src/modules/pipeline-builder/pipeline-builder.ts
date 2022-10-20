import type { DataService } from 'mongodb-data-service';
import type * as t from '@babel/types';
import parseEJSON, { ParseMode } from 'ejson-shell-parser';
import type { Document } from 'bson';
import { PipelinePreviewManager } from './pipeline-preview-manager';
import type { PreviewOptions } from './pipeline-preview-manager';
import { PipelineParser } from './pipeline-parser';
import Stage from './stage';

export const DEFAULT_PIPELINE = `[\n{}\n]`;

export class PipelineBuilder {
  source: string;
  node: t.ArrayExpression | null = null;
  stages: Stage[] = [];
  syntaxError: SyntaxError[] = [];
  // todo: make private COMPASS-6167
  previewManager: PipelinePreviewManager;

  constructor(dataService: DataService, source = DEFAULT_PIPELINE) {
    this.previewManager = new PipelinePreviewManager(dataService);
    this.source = source;
    this.sourceToStages();
  }

  /**
   * Completely reset pipeline state with provided source
   */
  reset(source = DEFAULT_PIPELINE) {
    this.source = source;
    this.stages = [];
    this.syntaxError = [];
    this.sourceToStages();
  }

  /**
   * Cancel preview requests that are currently inflight starting from index
   */
  stopPreview(from?: number): void {
    this.previewManager.clearQueue(from);
  }

  /**
   * Change the pipeline source and validate it
   */
  changeSource(source: string): void {
    this.source = source;
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
        .filter(Boolean) as SyntaxError[];
    } catch (e) {
      this.syntaxError = [e as SyntaxError];
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
    return parseEJSON(this.source, { mode: ParseMode.Loose });
  }

  /**
   * Request preview for current pipeline source
   */
  getPreviewForPipeline(
    namespace: string,
    options: PreviewOptions
  ): Promise<Document[]> {
    const pipeline = this.getPipelineFromSource();
    return this.previewManager.getPreviewForStage(
      pipeline.length - 1,
      namespace,
      pipeline,
      options
    );
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
    this.source = PipelineParser.generate(
      this.node,
      this.stages.map((stage) => stage.node)
    );
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
  getPipelineStringFromStages(stages = this.stages): string {
    const stage = stages.find((stage) => stage.syntaxError);
    if (stage) {
      throw stage.syntaxError;
    }
    return `[${stages.map((stage) => stage.toString()).join(',\n')}\n]`;
  }

  /**
   * Returns current source of the pipeline
   */
  getPipelineStringFromSource(): string {
    return this.source;
  }

  /**
   * Get runnable pipeline from current pipeline stages. Will throw if pipeline
   * contains errors
   */
  getPipelineFromStages(stages = this.stages): Document[] {
    return parseEJSON(this.getPipelineStringFromStages(stages), {
      mode: ParseMode.Loose
    });
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
}
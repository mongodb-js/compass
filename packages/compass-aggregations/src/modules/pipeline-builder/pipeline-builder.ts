import type { DataService } from 'mongodb-data-service';
import type * as t from '@babel/types';
import parseEJSON from 'ejson-shell-parser';

import { PipelinePreviewManager } from './pipeline-preview-manager';
import type { PreviewOptions } from './pipeline-preview-manager';
import { PipelineParser, Stage } from './pipeline-parser';

const DEFAULT_PIPELINE = `[\n{}\n]`;

export class PipelineBuilder {
  private source: string;
  private node: t.ArrayExpression | null = null;
  private stages: Stage[] = [];
  private syntaxError: SyntaxError[] = [];
  private previewManager: PipelinePreviewManager;

  constructor(dataService: DataService) {
    this.previewManager = new PipelinePreviewManager(dataService);
    this.source = DEFAULT_PIPELINE;
    this.sourceToStages();
  }

  reset(source = DEFAULT_PIPELINE) {
    this.source = source;
    this.sourceToStages();
  }

  stopPreview() {
    this.previewManager.clearQueue();
  }

  // Pipeline (as text) specific methods
  changeSource(source: string) {
    this.source = source;
    this.validateSource();
  }
  sourceToStages() {
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

  private validateSource() {
    const { root, errors } = PipelineParser.validate(this.source);
    this.node = root;
    this.syntaxError = errors;
  }
  private getPipelineFromSource(): Document[] {
    if (this.syntaxError.length > 0) {
      throw this.syntaxError[0];
    }
    return parseEJSON(this.source, { mode: 'loose' });
  }
  getPreviewForPipeline(namespace: string, options: PreviewOptions) {
    const pipeline = this.getPipelineFromSource();
    return this.previewManager.getPreviewForStage(
      pipeline.length - 1,
      namespace,
      pipeline,
      options
    );
  }

  // Stage (builder ui) specific methods
  stagesToSource() {
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
  changeStageOperator(idx: number, operator: string) {
    return this.stages[idx].changeOperator(operator);
  }
  changeStageValue(idx: number, value: string) {
    return this.stages[idx].changeValue(value);
  }
  changeStageDisabled(idx: number, disabled: boolean) {
    return this.stages[idx].changeDisabled(disabled);
  }

  addStage(after: number = this.stages.length - 1): Stage {
    const stage = new Stage();
    this.stages.splice(after + 1, 0, stage);
    return stage;
  }
  removeStage(at: number): Stage {
    const stage = this.stages.splice(at, 1);
    return stage[0];
  }
  moveStage(from: number, to: number): Stage {
    const stage = this.stages.splice(from, 1)[0];
    this.stages.splice(to, 0, stage);
    return stage;
  }

  private getPipelineFromStages(stages = this.stages): Document[] {
    const stage = stages.find((stage) => stage.syntaxError);
    if (stage) {
      throw stage.syntaxError;
    }
    const stagesString = stages
      .map((stage) => stage.toString())
      .join(',\n');
    return parseEJSON(`[${stagesString}\n]`, { mode: 'loose' });
  }
  getPreviewForStage(
    idx: number,
    namespace: string,
    options: PreviewOptions,
    force: boolean,
  ) {
    return this.previewManager.getPreviewForStage(
      idx,
      namespace,
      this.getPipelineFromStages(this.stages.slice(0, idx + 1)),
      options,
      force
    );
  }
}
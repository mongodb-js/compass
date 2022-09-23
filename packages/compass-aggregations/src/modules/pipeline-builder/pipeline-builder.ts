import * as babelParser from '@babel/parser';
import type * as t from '@babel/types';
// TODO: typedefs are broken
import parseEJSON from 'ejson-shell-parser';
import {
  getStageOperatorFromNode,
  getStageValueFromNode,
  isDisabled,
  isStageLike,
  PipelineParser,
  setDisabled,
  assertStageNode
} from './pipeline-parser';
import type { AggregateOptions, Document } from 'mongodb';
import type { DataService } from 'mongodb-data-service';
import { PipelinePreviewManager } from './pipeline-preview-manager';

function getStringFromStage(stage: Stage) {
  const stageStr = `{
    ${stage.operator ?? ''}:\n${stage.value ?? ''}
  }`;
  return stage.disabled
    ? stageStr
        .split('\n')
        .map((line) => `// ${line}`)
        .join('\n')
    : stageStr;
}

class Stage {
  node: t.Expression;
  disabled = false;
  syntaxError: SyntaxError | null = null;
  operator: string | null = null;
  value: string | null = null;
  constructor(
    node: t.Expression = { type: 'ObjectExpression', properties: [] }
  ) {
    this.node = node;
    this.disabled = isDisabled(node);
    try {
      assertStageNode(node);
      this.operator = getStageOperatorFromNode(node);
      this.value = getStageValueFromNode(node);
    } catch (e) {
      this.syntaxError = e as SyntaxError;
    }
  }

  changeValue(newVal: string) {
    this.value = newVal;
    try {
      if (isStageLike(this.node)) {
        this.node.properties[0].value = babelParser.parseExpression(newVal);
        this.syntaxError = null;
      }
    } catch (e) {
      this.syntaxError = e as SyntaxError;
    }
  }

  changeOperator(newOp: string) {
    this.operator = newOp;
    if (isStageLike(this.node)) {
      this.node.properties[0].key = { type: 'Identifier', name: newOp };
    }
  }

  changeDisabled(newVal: boolean) {
    setDisabled(this.node, newVal);
    this.disabled = newVal;
  }
}

export class PipelineBuilder {
  source: string;
  node: t.ArrayExpression | null = null;
  stages: Stage[] = [];
  syntaxError: SyntaxError | null = null;
  private previewManager: PipelinePreviewManager;
  constructor(
    source = '[\n  {}\n]',
    { dataService }: { dataService: DataService }
  ) {
    this.previewManager = new PipelinePreviewManager(dataService);
    this.source = source;
    this.sourceToStages();
  }
  sourceToStages() {
    try {
      const { root, stages } = PipelineParser.parse(this.source);
      this.node = root;
      this.stages = stages.map((node) => {
        return new Stage(node);
      });
      // TODO: Make this an array of errors so that we can use ace-editor
      // annotations and show all the errors
      this.syntaxError =
        this.stages.find((stage) => stage.syntaxError)?.syntaxError ?? null;
    } catch (e) {
      this.syntaxError = e as SyntaxError;
    }
  }
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
  resetSource(newVal: string) {
    this.source = newVal;
    this.sourceToStages();
  }
  changeSource(newVal: string) {
    this.source = newVal;
    const { root, errors } = PipelineParser.validate(this.source);
    this.node = root;
    this.syntaxError = errors[0] ?? null;
  }
  getStage(idx: number): Stage | undefined {
    return this.stages[idx];
  }
  addStage(idx: number): Stage {
    const stage = new Stage();
    this.stages.splice(idx, 0, stage);
    return stage;
  }
  removeStage(idx: number): Stage {
    const stage = this.stages.splice(idx, 1);
    return stage[0];
  }
  moveStage(from: number, to: number): Stage {
    const stage = this.stages.splice(from, 1)[0];
    this.stages.splice(to, 0, stage);
    return stage;
  }
  getPipelineFromSource(): Document[] {
    if (this.syntaxError) {
      throw this.syntaxError;
    }
    return parseEJSON(this.source, { mode: 'loose' });
  }
  getPipelineFromStages(): Document[] {
    const error = this.stages.find((stage) => stage.syntaxError);
    if (error) {
      throw error;
    }
    const stages = this.stages
      .map((stage) => {
        return getStringFromStage(stage);
      })
      .join(',\n');
    return parseEJSON(`[${stages}]`, { mode: 'loose' });
  }
  getPreviewForPipeline(namespace: string, options: AggregateOptions) {
    const pipeline = this.getPipelineFromSource();
    return this.previewManager.getPreviewForStage(
      pipeline.length - 1,
      namespace,
      pipeline,
      options
    );
  }
  getPreviewForStage(
    idx: number,
    namespace: string,
    options: AggregateOptions
  ) {
    return this.previewManager.getPreviewForStage(
      idx,
      namespace,
      this.getPipelineFromStages(),
      options
    );
  }
}

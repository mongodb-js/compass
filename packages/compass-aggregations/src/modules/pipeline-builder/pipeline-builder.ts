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

function createStage({
  key,
  value
}: { key?: string; value?: string } = {}): t.ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        ...(key && { key: { type: 'Identifier', name: key } }),
        ...(value && { value: babelParser.parseExpression(value) }),
        computed: false,
        shorthand: false
        // NB: This is not a completely valid object property: it might be
        // missing either `key` or `value`, but for our purposes this is
        // alright as @babel/generator can handle these values missing, so
        // converting between text pipeline and stages pipeline will be still
        // possible
      } as t.ObjectProperty
    ]
  };
}

export class Stage {
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
      if (!isStageLike(this.node, true)) {
        this.node = createStage({ value: newVal });
      } else {
        this.node.properties[0].value = babelParser.parseExpression(newVal);
      }
      assertStageNode(this.node);
      this.syntaxError = null;
    } catch (e) {
      this.syntaxError = e as SyntaxError;
    }
  }

  changeOperator(newOp: string) {
    this.operator = newOp;
    try {
      if (!isStageLike(this.node, true)) {
        this.node = createStage({ key: newOp });
      } else {
        this.node.properties[0].key = { type: 'Identifier', name: newOp };
      }
      assertStageNode(this.node);
      this.syntaxError = null;
    } catch (e) {
      this.syntaxError = e as SyntaxError;
    }
  }

  changeDisabled(newVal: boolean) {
    setDisabled(this.node, newVal);
    this.disabled = newVal;
  }
}

export const DEFAULT_PIPELINE = '[\n  {}\n]';

export class PipelineBuilder {
  source: string;
  node: t.ArrayExpression | null = null;
  stages: Stage[] = [];
  syntaxError: SyntaxError[] = [];
  private previewManager: PipelinePreviewManager;
  constructor(
    source = DEFAULT_PIPELINE,
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
      this.syntaxError = this.stages
        .map((stage) => stage.syntaxError)
        .filter(Boolean) as SyntaxError[];
    } catch (e) {
      this.syntaxError = [e as SyntaxError];
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
  reset() {
    this.source = DEFAULT_PIPELINE;
    this.sourceToStages();
  }
  changeSource(newVal: string) {
    this.source = newVal;
    this.sourceToStages();
  }
  getStage(idx: number): Stage | undefined {
    return this.stages[idx];
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
  getPipelineFromSource(): Document[] {
    if (this.syntaxError.length > 0) {
      throw this.syntaxError[0];
    }
    return parseEJSON(this.source, { mode: 'loose' });
  }
  getPipelineFromStages(stages = this.stages): Document[] {
    const error = stages.find((stage) => stage.syntaxError);
    if (error) {
      throw error;
    }
    const stagesString = stages
      .map((stage) => {
        return getStringFromStage(stage);
      })
      .join(',\n');
    return parseEJSON(`[${stagesString}]`, { mode: 'loose' });
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
      this.getPipelineFromStages(this.stages.slice(0, idx + 1)),
      options
    );
  }
}

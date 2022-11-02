import * as babelParser from '@babel/parser';
import type * as t from '@babel/types';
import {
  isNodeDisabled,
  setNodeDisabled,
  assertStageNode,
  getStageValueFromNode,
  getStageOperatorFromNode,
  isStageLike,
} from './pipeline-parser/stage-parser';
import type { PipelineParserError } from './pipeline-parser/utils';
import { parseEJSON } from './pipeline-parser/utils';

function createStageNode({
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

export function stageToString(operator: string, value: string, disabled: boolean): string {
  const str = `{
  ${operator}: ${value}
}`;

  if (!disabled) {
    return str;
  }

  return str.split('\n')
    .map((line) => `// ${line}`)
    .join('\n');
}

let id = 0;

function getId() {
  return id++;
}

export default class Stage {
  id = getId();
  node: t.Expression;
  disabled = false;
  syntaxError: PipelineParserError | null = null;
  operator: string | null = null;
  value: string | null = null;
  constructor(
    node: t.Expression = { type: 'ObjectExpression', properties: [] }
  ) {
    this.node = node;
    this.disabled = isNodeDisabled(node);
    try {
      assertStageNode(node);
      this.operator = getStageOperatorFromNode(node);
      this.value = getStageValueFromNode(node);
    } catch (e) {
      this.syntaxError = e as PipelineParserError;
    }
  }

  changeValue(value: string) {
    this.value = value;
    try {
      if (!isStageLike(this.node, true)) {
        this.node = createStageNode({ value });
      } else {
        this.node.properties[0].value = babelParser.parseExpression(value);
      }
      assertStageNode(this.node);
      this.syntaxError = null;
    } catch (e) {
      this.syntaxError = e as PipelineParserError;
    }
    return this;
  }

  changeOperator(operator: string) {
    this.operator = operator;
    try {
      if (!isStageLike(this.node, true)) {
        this.node = createStageNode({ key: operator });
      } else {
        this.node.properties[0].key = { type: 'Identifier', name: operator };
      }
      assertStageNode(this.node);
      this.syntaxError = null;
    } catch (e) {
      this.syntaxError = e as PipelineParserError;
    }
    return this;
  }

  changeDisabled(value: boolean) {
    setNodeDisabled(this.node, value);
    this.disabled = value;
    return this;
  }

  toString() {
    return stageToString(
      this.operator ?? '',
      this.value ?? '',
      this.disabled
    );
  }

  toBSON() {
    if (this.disabled) {
      return null;
    }
    return parseEJSON(this.toString());
  }
}
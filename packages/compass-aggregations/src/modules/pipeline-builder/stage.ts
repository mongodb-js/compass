import * as babelParser from '@babel/parser';
import type * as t from '@babel/types';
import mongodbQueryParser from 'mongodb-query-parser';

import {
  isNodeDisabled,
  setNodeDisabled,
  assertStageNode,
  getStageValueFromNode,
  getStageOperatorFromNode,
  isStageLike,
} from './pipeline-parser/stage-parser';

const PARSE_ERROR = 'Stage must be a properly formatted document.';

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

function assertStageValue(value: string) {
  // mongodbQueryParser will either throw or return an
  // empty string if input is not a valid query
  const parsed = (mongodbQueryParser as any)(value);
  if (parsed === '') {
    throw new Error(PARSE_ERROR);
  }
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

export default class Stage {
  node: t.Expression;
  disabled = false;
  syntaxError: SyntaxError | null = null;
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
      this.syntaxError = e as SyntaxError;
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
      assertStageValue(value);
      this.syntaxError = null;
    } catch (e) {
      this.syntaxError = e as SyntaxError;
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
      this.syntaxError = e as SyntaxError;
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
}
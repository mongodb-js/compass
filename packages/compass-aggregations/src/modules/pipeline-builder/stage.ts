import * as babelParser from '@babel/parser';
import * as t from '@babel/types';
import {
  isNodeDisabled,
  setNodeDisabled,
  assertStageNode,
  getStageValueFromNode,
  getStageOperatorFromNode,
  isStageLike,
  StageAssertionErrorCodes,
} from './pipeline-parser/stage-parser';
import type { PipelineParserError } from './pipeline-parser/utils';
import { generate } from './pipeline-parser/utils';
import { parseShellBSON } from './pipeline-parser/utils';
import { getId } from './stage-ids';

function createStageNode({
  key,
  value,
}: { key?: string; value?: string } = {}): t.ObjectExpression {
  return {
    type: 'ObjectExpression',
    properties: [
      {
        type: 'ObjectProperty',
        ...(key && { key: { type: 'Identifier', name: key } }),
        ...(value && { value: babelParser.parseExpression(value) }),
        computed: false,
        shorthand: false,
        // NB: This is not a completely valid object property: it might be
        // missing either `key` or `value`, but for our purposes this is
        // alright as @babel/generator can handle these values missing, so
        // converting between text pipeline and stages pipeline will be still
        // possible
      } as t.ObjectProperty,
    ],
  };
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

  /**
   * Returns true if both operator and value are empty / missing, false
   * otherwise
   */
  get isEmpty(): boolean {
    // To be able to set operator or value for the Stage, we should be able to
    // parse it, to avoid marking stages with parse errors (or errors that are
    // not related to stage operator missing) we check for a specific error code
    // before checking for empty
    if (
      this.syntaxError &&
      this.syntaxError.code !== StageAssertionErrorCodes.NoStageOperator
    ) {
      return false;
    }
    return !this.operator?.trim() && !this.value?.trim();
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
    let str = '';

    if (!this.syntaxError) {
      str = generate(this.node);
    } else {
      // In cases where stage contains syntax errors, we will not be able to just
      // generate the source from node. Instead we will create a template and use
      // current stage value and operator source to populate it while trying to
      // preserve stage comments
      const template = t.objectExpression(
        !this.isEmpty
          ? [
              t.objectProperty(
                t.identifier('$$_STAGE_OPERATOR'),
                t.identifier('$$_STAGE_VALUE')
              ),
            ]
          : []
      );

      template.leadingComments = this.node.leadingComments;
      template.trailingComments = this.node.trailingComments;

      if (
        t.isObjectExpression(this.node) &&
        this.node.properties[0] &&
        template.properties[0]
      ) {
        template.properties[0].leadingComments =
          this.node.properties[0].leadingComments;
        template.properties[0].trailingComments =
          this.node.properties[0].trailingComments;
      }

      str = generate(template, {
        // To avoid trailing comma after the stage value placeholder
        trailingComma: 'none',
      })
        .replace('$$_STAGE_OPERATOR', this.operator ?? '')
        .replace('$$_STAGE_VALUE', this.value ?? '');
    }

    if (!this.disabled) {
      return str;
    }

    return str
      .split('\n')
      .map((line) => (/^\s*\/\//.test(line) ? line : `// ${line}`))
      .join('\n');
  }

  toBSON() {
    if (this.disabled) {
      return null;
    }
    return parseShellBSON(this.toString());
  }
}

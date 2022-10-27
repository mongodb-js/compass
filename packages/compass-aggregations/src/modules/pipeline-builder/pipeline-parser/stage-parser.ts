import * as babelParser from '@babel/parser';
import type * as t from '@babel/types';

import { generate, PipelineParserError } from './utils';

export type StageLike = t.ObjectExpression & {
  properties: [t.ObjectProperty & { key: t.Identifier | t.StringLiteral }];
};

const kDisabled = Symbol('disabled');

export function isNodeDisabled(node: t.Node): boolean {
  return !!(node as any)[kDisabled];
}

export function setNodeDisabled(node: t.Node, value: boolean) {
  (node as any)[kDisabled] = value;
}

export function isStageLike(node?: t.Node | null, loose = false): node is StageLike {
  return (
    !!node &&
    node.type === 'ObjectExpression' &&
    node.properties.length === 1 &&
    node.properties[0].type === 'ObjectProperty' &&
    node.properties[0].key &&
    ((node.properties[0].key.type === 'Identifier' &&
      node.properties[0].key.name.startsWith('$')) ||
      (node.properties[0].key.type === 'StringLiteral' &&
        node.properties[0].key.value.startsWith('$'))) &&
    (loose || node.properties[0].value != null)
  );
}

export function assertStageNode(node: t.Node): asserts node is StageLike {
  if (isStageLike(node)) {
    return;
  }
  const message = node.type === 'ObjectExpression'
    ? (node.properties[0] as t.ObjectProperty | undefined)?.key == null
      ? 'A pipeline stage specification object must contain exactly one field.'
      : 'Stage value can not be empty'
    : 'Each element of the pipeline array must be an object';

  throw new PipelineParserError(message, node.loc?.start);
}

export function getStageOperatorFromNode(node: StageLike): string {
  return node.properties[0].key.type === 'Identifier'
    ? node.properties[0].key.name
    : node.properties[0].key.value;
}

export function getStageValueFromNode(node: StageLike): string {
  const stageAst = node.properties[0].value;
  const stageTrailingComments = node.properties[0].trailingComments;
  // If the stage value has trailing comments
  if (stageTrailingComments) {
    stageAst.trailingComments = (stageAst.trailingComments ?? []).concat(stageTrailingComments)
  }
  return generate(stageAst);
}

/**
 * Converts a stage ast to line comments.
 */
export function stageToAstComments(stage: t.Expression): t.CommentLine[] {
  return generate(stage)
    .trim()
    .split('\n')
    .map((line: string) => {
      return { type: 'CommentLine', value: ` ${line}` };
    });
}

/**
 * A line by line parser that stops as soon as lines are a valid object
 * expression representing a stage
 */
export default class StageParser {

  public source = '';
  private maybeObject = false;

  push(str: string): false | StageLike {
    this.maybeObject = this.maybeObject || /^\s*\{/.test(str);
    this.source +=
      (this.maybeObject || /^\s*\/\//.test(str) ? str : `// ${str}`) + '\n';
    if (!this.maybeObject) {
      return false;
    }
    try {
      const maybeStage = babelParser.parseExpression(
        // We might have a trailing comma at the end if multiple stages were
        // commented out, to cover this we will always try to parse as if there
        // is no commas
        this.source.replace(/\}(,|;)\s*$/, '}')
      );
      if (isStageLike(maybeStage)) {
        this.maybeObject = false;
        this.source = '';
        return maybeStage;
      }
      return false;
    } catch {
      return false;
    }
  }
}
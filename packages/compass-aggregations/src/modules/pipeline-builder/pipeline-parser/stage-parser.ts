import * as babelParser from '@babel/parser';
import type * as t from '@babel/types';
import type Stage from '../stage';

import { generate, parseShellBSON, PipelineParserError } from './utils';

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

export function isValidStageNode(node?: t.ObjectExpression): boolean {
  if (node) {
    try {
      // TODO: either export ejson-shell-parser logic that validates the AST or
      // move the logic in this package to avoid generating source from ast
      // before validating it again
      parseShellBSON(generate(node));
      return true;
    } catch (err) {
      return false;
    }
  }
  return false;
}

export function isStageLike(
  node?: t.Node | null,
  loose = false
): node is StageLike {
  try {
    assertStageNode(node, loose);
    return true;
  } catch {
    return false;
  }
}

function getKeyName(node: t.ObjectProperty['key']): string | null {
  return node.type === 'Identifier'
    ? node.name
    : node.type === 'StringLiteral'
    ? node.value
    : null;
}

export function assertStageNode(
  node?: t.Node | null,
  loose = false
): asserts node is StageLike {
  let error: string | null = null;
  let causedBy = node;

  if (!node || node.type !== 'ObjectExpression') {
    error = 'Each element of the pipeline array must be an object';
  } else if (
    node.properties.length !== 1 ||
    node.properties[0].type !== 'ObjectProperty' ||
    node.properties[0].key == null
  ) {
    error =
      'A pipeline stage specification object must contain exactly one field.';
    causedBy = node.properties[0] ?? causedBy;
  } else if (!getKeyName(node.properties[0].key)?.startsWith('$')) {
    const key = getKeyName(node.properties[0].key) ?? '';
    error = `Unrecognized pipeline stage name${key ? `: '${key}'` : ''}`;
    causedBy = node.properties[0].key;
  } else if (!loose && node.properties[0].value == null) {
    error = 'Stage value can not be empty';
  } else if (!loose && !isValidStageNode(node)) {
    error = 'Stage value is invalid';
    causedBy = node.properties[0].value;
  }

  if (error) {
    throw new PipelineParserError(error, causedBy?.loc?.start);
  }
}

export function getStageOperatorFromNode(node: StageLike): string {
  return node.properties[0].key.type === 'Identifier'
    ? node.properties[0].key.name
    : node.properties[0].key.value;
}

export function getStageValueFromNode(node: StageLike): string {
  const stagePropertyNode = node.properties[0];
  const stageValueNode = stagePropertyNode.value;
  // If the stage property has trailing comments move them to the stage value so
  // that they are visible in the editor and delete them from the propery itself
  // to avoid duplication when we generate source from node
  if (stagePropertyNode.trailingComments) {
    stageValueNode.trailingComments = [
      ...(stageValueNode.trailingComments ?? []),
      ...(stagePropertyNode.trailingComments ?? [])
    ];
    delete stagePropertyNode.trailingComments;
  }
  return generate(stageValueNode);
}

/**
 * Converts a stage ast to line comments.
 */
export function stageToAstComments(stage: Stage): t.CommentLine[] {
  return stage
    .toString()
    .trim()
    .split('\n')
    .map((line: string) => {
      return {
        type: 'CommentLine',
        value: ` ${line.replace(/^\s*\/\/\s/, '')}`
      };
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
        // We might have a trailing comma or a beginning of a new object at the
        // end if multiple stages were commented out, to cover this we will
        // always try to parse as if there no commas or new object starting and
        // will account for this later
        this.source.replace(/\}(,(\s*\{.*?)?|;)(\s*)$/, '}')
      );
      // If we found a stage, reset the parser and return it
      if (isStageLike(maybeStage)) {
        // If there was an object at the end of the current source, preserve it
        // for the next line push
        const { groups } =
          this.source.match(/\}(,(?<newObject>\s*\{.*?)?|;)(\s*)$/) ?? {};
        this.source = groups?.newObject ?? '';
        this.maybeObject = !!groups?.newObject;
        return maybeStage;
      }
      // Otherwise we are running into an object expression that is not a valid
      // stage. Convert everything that is not a comment line yet into a comment
      // and continue
      this.source =
        this.source
          .trimEnd()
          .split('\n')
          .map((line) => {
            return /^\s*\/\//.test(line) ? line : `// ${line}`;
          })
          .join('\n') + '\n';
      this.maybeObject = false;
      return false;
    } catch {
      return false;
    }
  }
}

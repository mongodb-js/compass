import * as babelParser from '@babel/parser';
import babelTraverse from '@babel/traverse';
import babelGenerate from '@babel/generator';
import * as t from '@babel/types';
import prettier from 'prettier';

// We mark certain AST nodes as disabled
function asNodeKey(v: any): keyof t.Node {
  return v;
}

const kDisabled = asNodeKey(Symbol('disabled'));

export function isDisabled(node: t.Node): boolean {
  return !!node[kDisabled];
}

export function setDisabled(node: t.Node, value: boolean) {
  (node as any)[kDisabled] = value;
}

type StageLike = t.ObjectExpression & {
  properties: [t.ObjectProperty & { key: t.Identifier | t.StringLiteral }];
};

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

export function generate(ast: t.Node) {
  return prettier
    .format(babelGenerate(ast).code, {
      printWidth: 60,
      // Prettier only only understands statements, so we use internal
      // expression parser (it's just babel.parseExpression instead of
      // babel.parse) as all our cases are for formatting expressions
      //
      // TODO: Would be good to use our version of babel here, but currently
      // this fails. Requires to dig a bit deeper into how the custom parsers
      // work
      parser: '__js_expression'
    })
    .trim();
}

export function getStageOperatorFromNode(node: StageLike): string {
  return node.properties[0].key.type === 'Identifier'
    ? node.properties[0].key.name
    : node.properties[0].key.value;
}

export function getStageValueFromNode(node: StageLike): string {
  return generate(node.properties[0].value);
}

export function assertStageNode(node: t.Node): asserts node is StageLike {
  if (isStageLike(node)) {
    return;
  }
  throw new SyntaxError(
    node.type === 'ObjectExpression'
      ? (node.properties[0] as t.ObjectProperty | undefined)?.key == null
        ? 'A pipeline stage specification object must contain exactly one field.'
        : 'Stage value can not be empty'
      : 'Each element of the pipeline array must be an object'
  );
}

/**
 * A line by line parser that stops as soon as lines are a valid object
 * expression representing a stage
 */
class StageParser {
  public source = '';
  private maybeObject = false;
  push(str: string): false | t.ObjectExpression {
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

function commentsToCommentGroups(
  comments: t.Comment[]
): (t.CommentBlock | t.CommentLine[])[] {
  const groups: (t.CommentBlock | t.CommentLine[])[] = [];
  let i = 0;
  for (const comment of comments) {
    if (comment.type === 'CommentBlock') {
      groups.push(comment);
      i++;
    } else {
      groups[i] ??= [];
      (groups[i] as t.CommentLine[]).push(comment);
    }
  }
  return groups;
}

/**
 * Parses comment blocks to stages with a few assumptions:
 *
 * - Sequential comment lines are parsed as one multiline
 * - Stage always starts with a opening curly brace
 * - Stage is a valid ObjectExpression (we can parse it as one)
 * - Everything above a commented out stage that is not a stage is a comment
 *   that belongs to the stage
 */
function extractStagesFromComments(
  comments: t.Comment[]
): [Set<t.Comment>, t.ObjectExpression[]] {
  type Line = { value: string; node: t.Comment };
  const stages: t.ObjectExpression[] = [];
  const remove = new Set<t.Comment>();
  const groups = commentsToCommentGroups(comments);
  for (const group of groups) {
    const lines: Line[] = Array.isArray(group)
      ? group.map((comment) => {
          return { value: comment.value, node: comment };
        })
      : group.value.split('\n').map((line) => {
          // Block comments usually have every line prepended by a *, we will
          // try to account for that
          return { value: line.replace(/^\s*\*/, ''), node: group };
        });
    const parser = new StageParser();
    let seenComments: t.Comment[] = [];
    for (const line of lines) {
      seenComments.push(line.node);
      const maybeStage = parser.push(line.value);
      if (maybeStage) {
        // Mark a stage so that we know that it was extracted from comments
        setDisabled(maybeStage, true);
        stages.push(maybeStage);
        seenComments.forEach((comment) => {
          remove.add(comment);
        });
        seenComments = [];
      }
    }
  }
  return [remove, stages];
}

function extractStagesFromNode(node: t.Expression): t.Expression[] {
  const [leadingRemove, leadingStages] = extractStagesFromComments(
    node.leadingComments ?? []
  );
  node.leadingComments = node.leadingComments?.filter((node) => {
    return !leadingRemove.has(node);
  });
  const [trailingRemove, trailingStages] = extractStagesFromComments(
    node.trailingComments ?? []
  );
  node.trailingComments = node.trailingComments?.filter((node) => {
    return !trailingRemove.has(node);
  });
  return [...leadingStages, node, ...trailingStages];
}

export class PipelineParser {
  // Parse source to stages
  static parse(source: string): {
    root: t.ArrayExpression;
    stages: t.Expression[];
  } {
    const stages: t.Expression[] = [];
    const root = babelParser.parseExpression(source);
    if (root.type !== 'ArrayExpression') {
      throw new SyntaxError('Pipeline must be an array of aggregation stages');
    }
    babelTraverse(root, {
      noScope: true,
      ArrayExpression: (path) => {
        if (path.node !== root) {
          return;
        }
        const [comments, stages] = extractStagesFromComments(
          // Inner comments will only be available here if there is no other
          // elements in the array, in our case it might mean that all stages
          // are disabled
          path.node.innerComments ?? []
        );
        path.node.innerComments = path.node.innerComments?.filter((node) => {
          return !comments.has(node);
        });
        stages.push(...stages);
      },
      Expression: (path) => {
        // We only care about direct children of array expression
        if (path.parent !== root) {
          return;
        }
        stages.push(...extractStagesFromNode(path.node));
      }
    });
    return { root, stages };
  }
  // Validate that source is parseable and all stages look like valid pipeline
  // stages
  static validate(source: string): {
    root: t.ArrayExpression | null;
    errors: SyntaxError[];
  } {
    let root: babelParser.ParseResult<t.Expression> | null = null;
    const errors: SyntaxError[] = [];
    try {
      const _root = babelParser.parseExpression(source);
      if (_root.type !== 'ArrayExpression') {
        throw new SyntaxError(
          'Pipeline must be an array of aggregation stages'
        );
      }
      root = _root;
      babelTraverse(root, {
        noScope: true,
        Expression: (path) => {
          // We only care about direct children of array expression
          if (path.parent !== root) {
            return;
          }
          try {
            assertStageNode(path.node);
          } catch (e) {
            errors.push(e as SyntaxError);
          }
        }
      });
    } catch (e) {
      errors.push(e as SyntaxError);
    }
    return { root, errors };
  }
  // Generate source from stages
  static generate(root: t.ArrayExpression, stages: t.Expression[]): string {
    const isAllDisabled = stages.every((stage) => {
      return isDisabled(stage);
    });
    // Special case where all stages should be added as inner comments to the
    // array expression
    if (isAllDisabled) {
      root.elements = [];
      root.innerComments = stages.flatMap((stage) => {
        return stageToComments(stage);
      });
    } else {
      root.elements = stages
        .reduceRight((elements, stage) => {
          if (!isDisabled(stage)) {
            elements.push(stage);
          } else {
            const prevStage = elements[elements.length - 1];
            t.addComments(prevStage, 'leading', stageToComments(stage));
          }
          return elements;
        }, [] as t.Expression[])
        .reverse();
    }
    return generate(root);
  }
}

function stageToComments(stage: t.Expression): t.CommentLine[] {
  return generate(stage)
    .trim()
    .split('\n')
    .map((line: string) => {
      return { type: 'CommentLine', value: ` ${line}` };
    });
}

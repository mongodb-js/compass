import * as babelParser from '@babel/parser';
import * as t from '@babel/types';
import StageParser, { stageToComments, assertStageNode, isNodeDisabled, setNodeDisabled } from './stage-parser';
import { generate } from './utils';

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
  const visitedComments = new Set<t.Comment>();
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
        setNodeDisabled(maybeStage, true);
        stages.push(maybeStage);
        seenComments.forEach((comment) => {
          visitedComments.add(comment);
        });
        seenComments = [];
      }
    }
  }
  return [visitedComments, stages];
}

function extractStagesFromNode(node: t.Expression): t.Expression[] {
  const [leadingVisited, leadingStages] = extractStagesFromComments(
    node.leadingComments ?? []
  );
  node.leadingComments = node.leadingComments?.filter((node) => {
    return !leadingVisited.has(node);
  });
  const [trailingVisited, trailingStages] = extractStagesFromComments(
    node.trailingComments ?? []
  );
  node.trailingComments = node.trailingComments?.filter((node) => {
    return !trailingVisited.has(node);
  });
  return [...leadingStages, node, ...trailingStages];
}

type ParseResponse = {
  root: t.ArrayExpression;
  stages: t.Expression[];
};

type ValidateResponse = {
  root: t.ArrayExpression | null;
  errors: SyntaxError[];
};

export default class PipelineParser {
  static parse(source: string): ParseResponse {
    const stages: t.Expression[] = [];
    const root = PipelineParser._parseStringToRoot(source);
    // Inner comments will only be available here if there is no other
    // elements in the array, in our case it might mean that all stages
    // are disabled
    if (root.elements.length === 0 && root.innerComments?.length) {
      const [, _stages] = extractStagesFromComments(
        root.innerComments
      );
      stages.push(..._stages);
    }
    root.elements.forEach((node) => {
      stages.push(...extractStagesFromNode(node as t.Expression));
    });
    return { root, stages };
  }

  static _parseStringToRoot(source: string): t.ArrayExpression {
    const root = babelParser.parseExpression(source);
    if (root.type !== 'ArrayExpression') {
      throw new SyntaxError('Pipeline must be an array of aggregation stages');
    }
    return root;
  }

  // Validate that source is parseable and all stages look like valid pipeline
  // stages
  static validate(source: string): ValidateResponse {
    let root: t.ArrayExpression | null = null;
    const errors: SyntaxError[] = [];
    try {
      root = PipelineParser._parseStringToRoot(source);
      root.elements.forEach(stage => {
        try {
          assertStageNode(stage as t.Expression);
        } catch (e) {
          errors.push(e as SyntaxError);
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
      return isNodeDisabled(stage);
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
          if (!isNodeDisabled(stage)) {
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
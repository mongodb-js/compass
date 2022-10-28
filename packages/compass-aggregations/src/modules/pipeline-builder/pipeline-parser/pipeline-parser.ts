import * as babelParser from '@babel/parser';
import type * as t from '@babel/types';
import StageParser, {
  stageToAstComments,
  assertStageNode,
  isNodeDisabled,
  setNodeDisabled
} from './stage-parser';
import { generate } from './utils';
import { PipelineParserError } from './utils';

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
        // Line comments usually have one space at the beginning, normalizing it
        // here makes it easier to better format the code later
        return { value: comment.value.replace(/^\s/, ''), node: comment };
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
  errors: PipelineParserError[];
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
      throw new PipelineParserError('Pipeline must be an array of aggregation stages');
    }
    return root;
  }

  // Validate that source is parseable and all stages look like valid pipeline
  // stages
  static validate(source: string): ValidateResponse {
    let root: t.ArrayExpression | null = null;
    const errors: PipelineParserError[] = [];
    try {
      root = PipelineParser._parseStringToRoot(source);
      root.elements.forEach(stage => {
        try {
          assertStageNode(stage as t.Expression);
        } catch (e) {
          errors.push(e as PipelineParserError);
        }
      });
    } catch (e) {
      errors.push(e as PipelineParserError);
    }
    return { root, errors };
  }
  // Generate source from stages
  static generate(root: t.ArrayExpression, stages: t.Expression[]): string {
    const isAllDisabled = stages.length && stages.every((stage) => {
      return isNodeDisabled(stage);
    });
    // Special case where all stages should be added as inner comments to the
    // array expression
    if (isAllDisabled) {
      root.elements = [];
      root.innerComments = stages.flatMap((stage) => {
        return stageToAstComments(stage);
      });
    } else {
      root.elements = PipelineParser._getStageNodes(stages);
    }
    return generate(root);
  }

  static _getStageNodes(stages: t.Expression[]): t.ArrayExpression['elements'] {
    const elements: t.ArrayExpression['elements'] = [];
    let unusedComments: t.CommentLine[] = [];

    for (const stage of stages) {
      // If node is disabled, store the node as comments for later use
      if (isNodeDisabled(stage)) {
        const comments = stageToAstComments(stage);
        unusedComments.push(...comments);
        continue;
      }

      // If node is enabled and there are some comments in the stack, attach
      // them as as leading comments to the stage
      if (unusedComments.length) {
        stage.leadingComments = [
          ...unusedComments,
          ...(stage.leadingComments ?? [])
        ];
        unusedComments = [];
      }

      elements.push(stage);
    }

    const lastStage = elements[elements.length - 1];

    // If we still have some comments left after we went through all stages, add
    // them as trailing comments to the last stage
    if (lastStage && unusedComments.length > 0) {
      lastStage.trailingComments = [
        ...(lastStage.trailingComments ?? []),
        ...unusedComments
      ];
    }

    return elements;
  }
}

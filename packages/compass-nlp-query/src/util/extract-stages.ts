import { parse } from 'acorn-loose';
import { generate } from 'astring';
import mongodbQueryParser from 'mongodb-query-parser';
import decomment from 'decomment';
import type { Document } from 'mongodb';

// TODO: Less `any` usage (looks like acorn-loose does not have a types package).

type Stage = {
  operator: string;
  source: string;
  parsedSource: Document;
};

export function extractStages(input: string) {
  const stages = programToStages(parseProgram(input));

  if (!stages) {
    throw new Error(
      'Unable to extract pipeline stages: the provided input is not an array of objects.');
  }

  return stages;
}

function parseProgram(input: string) {
  try {
    const program = parse(input, {
      ecmaVersion: 6
    });

    return program;
  } catch (originalError: any) {
    const err = new Error(`Unable to parse the pipeline source: ${originalError.message as string}`);
    err.stack = originalError.stack;
    throw err;
  }
}

function programToStages(program: any): undefined | Stage[] {
  if (
    !program.body ||
    program.body.length !== 1) {
    return;
  }

  const node = program.body[0];

  if (node.type !== 'ExpressionStatement') {
    return;
  }

  const { type, elements } = node.expression || {};

  if (type !== 'ArrayExpression') {
    return;
  }

  if (elements.find((element: any) => !isValidObjectExpression(element))) {
    return;
  }

  return elements.map((element: any) => objectExpressionToStage(element));
}

function isValidObjectExpression(element: any) {
  return element.type === 'ObjectExpression' &&
    element.properties &&
    element.properties.length === 1;
}

export const PARSE_ERROR = 'Unable to parse stage in pipeline, the stage must be a properly formatted document.';

function parseStage(stageSource: string) {
  const parsed = mongodbQueryParser(stageSource);

  // mongodbQueryParser will either throw or return an empty string if input is
  // not a valid query
  if (parsed === '') {
    throw new Error(PARSE_ERROR);
  }

  return parsed;
}

function objectExpressionToStage(objectExpression: any): Stage {
  const { key: keyNode, value: valueNode } = objectExpression.properties[0];
  
  // Keep comments? (comments: true)
  const source = generate(valueNode, { comments: false, indent: '  ' });
  
  return {
    operator: keyNode.name || keyNode.value,
    source,
    parsedSource: parseStage(decomment(source))
  };
}

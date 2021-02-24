import { parse } from 'acorn-loose';
import { generate } from 'astring';

export function extractStages(input) {
  const stages = programToStages(parseProgram(input));

  if (!stages) {
    throw new Error(
      'Unable to extract pipeline stages: the provided input is not an array of objects.');
  }

  return stages;
}

function parseProgram(input) {
  try {
    const program = parse(input, {
      ecmaVersion: 6
    });

    return program;
  } catch (originalError) {
    const err = new Error(`Unable to parse the pipeline source: ${originalError.message}`);
    err.stack = originalError.stack;
    throw err;
  }
}

function programToStages(program) {
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

  if (elements.find((element) => !isValidObjectExpression(element))) {
    return;
  }

  return elements.map(element => objectExpressionToStage(element));
}

function isValidObjectExpression(element) {
  return element.type === 'ObjectExpression' &&
    element.properties &&
    element.properties.length === 1;
}

function objectExpressionToStage(objectExpression) {
  const { key: keyNode, value: valueNode } = objectExpression.properties[0];
  return {
    operator: keyNode.name,
    source: generate(valueNode, { comments: true, indent: '  ' })
  };
}

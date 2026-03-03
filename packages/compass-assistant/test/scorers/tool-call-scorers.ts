/**
 * Tool call scorers for evaluating whether the assistant generates
 * the correct tool calls.
 *
 * These are local stubs. When the AEL package is ready, these should be
 * replaced with imports from the AEL.
 *
 * TODO: Replace with AEL package imports when available.
 */

import type { ToolCallPart } from 'ai';
import type { ExpectedOutputMessage } from '../eval-cases/tool-call-cases';

export interface ScorerResult {
  name: string;
  score: number | null;
  metadata?: Record<string, unknown>;
}

export interface ToolCallScorerInput {
  output: { toolCalls: ToolCallPart[] };
  expected: { outputMessages: ExpectedOutputMessage[] };
}

type ToolCallScorer = (input: ToolCallScorerInput) => ScorerResult;

/**
 * Checks whether the total number of tool calls matches the expected count.
 * Score: 1 if exact match, 0 otherwise.
 */
export const ToolCallAmountCorrect: ToolCallScorer = ({ output, expected }) => {
  const expectedCount = expected.outputMessages.reduce(
    (sum, msg) => sum + msg.toolCalls.length,
    0
  );
  const actualCount = output.toolCalls.length;

  return {
    name: 'ToolCallAmountCorrect',
    score: expectedCount === actualCount ? 1 : 0,
    metadata: { expectedCount, actualCount },
  };
};

/**
 * Checks whether the tool calls appear in the correct order (by tool name).
 * Score: 1 if order matches, 0 otherwise.
 */
export const ToolOrderCorrect: ToolCallScorer = ({ output, expected }) => {
  const expectedNames = expected.outputMessages.flatMap((msg) =>
    msg.toolCalls.map((tc) => tc.name)
  );
  const actualNames = output.toolCalls.map((tc) => tc.toolName);

  if (expectedNames.length !== actualNames.length) {
    return {
      name: 'ToolOrderCorrect',
      score: 0,
      metadata: { expectedNames, actualNames },
    };
  }

  const isCorrect = expectedNames.every((name, i) => name === actualNames[i]);
  return {
    name: 'ToolOrderCorrect',
    score: isCorrect ? 1 : 0,
    metadata: { expectedNames, actualNames },
  };
};

/**
 * Checks whether the tool call arguments match expectations.
 * Only checks arguments that are explicitly specified in the expected data.
 * Score: fraction of expected arguments that match (0 to 1).
 */
export const ToolArgumentsCorrect: ToolCallScorer = ({ output, expected }) => {
  const expectedCalls = expected.outputMessages.flatMap((msg) => msg.toolCalls);
  const actual = output.toolCalls;

  if (expectedCalls.length === 0 || actual.length === 0) {
    return {
      name: 'ToolArgumentsCorrect',
      score: expectedCalls.length === 0 && actual.length === 0 ? 1 : 0,
    };
  }

  let totalChecks = 0;
  let passedChecks = 0;

  for (let i = 0; i < Math.min(expectedCalls.length, actual.length); i++) {
    const expectedCall = expectedCalls[i];
    const actualCall = actual[i];

    if (!expectedCall.arguments || expectedCall.arguments.length === 0) {
      continue;
    }

    const actualInput = (actualCall.input ?? {}) as Record<string, unknown>;

    for (const expectedArg of expectedCall.arguments) {
      totalChecks++;
      const actualValue = actualInput[expectedArg.name];

      if (expectedArg.value !== undefined) {
        if (typeof expectedArg.value === 'object') {
          if (
            JSON.stringify(actualValue) === JSON.stringify(expectedArg.value)
          ) {
            passedChecks++;
          }
        } else if (actualValue === expectedArg.value) {
          passedChecks++;
        }
      } else if (expectedArg.matchRegex) {
        if (
          typeof actualValue === 'string' &&
          new RegExp(expectedArg.matchRegex).test(actualValue)
        ) {
          passedChecks++;
        }
      } else if (expectedArg.type) {
        if (expectedArg.type === 'array' && Array.isArray(actualValue)) {
          passedChecks++;
        } else if (typeof actualValue === expectedArg.type) {
          passedChecks++;
        }
      } else {
        if (actualValue !== undefined) {
          passedChecks++;
        }
      }
    }
  }

  return {
    name: 'ToolArgumentsCorrect',
    score: totalChecks === 0 ? 1 : passedChecks / totalChecks,
    metadata: { totalChecks, passedChecks },
  };
};

/**
 * Checks that the overall message ordering is correct — tool calls and
 * assistant text messages appear in the expected sequence.
 */
export const MessageOrderCorrect: ToolCallScorer = (input) => {
  const result = ToolOrderCorrect(input);
  return {
    ...result,
    name: 'MessageOrderCorrect',
  };
};

/**
 * Compound scorer that combines the individual tool call scores.
 * Returns the average of all non-null individual scores.
 */
export const CompoundToolCorrectness: ToolCallScorer = (input) => {
  const results = [
    ToolCallAmountCorrect(input),
    ToolOrderCorrect(input),
    ToolArgumentsCorrect(input),
    MessageOrderCorrect(input),
  ];

  const scores = results
    .map((r) => r.score)
    .filter((s): s is number => s !== null);

  const avgScore =
    scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;

  return {
    name: 'CompoundToolCorrectness',
    score: avgScore,
    metadata: {
      componentScores: Object.fromEntries(
        results.map((r) => [r.name, r.score])
      ),
    },
  };
};

export const ToolCallScorers = [
  ToolCallAmountCorrect,
  ToolOrderCorrect,
  ToolArgumentsCorrect,
  MessageOrderCorrect,
  CompoundToolCorrectness,
];

/**
 * Demonstration script showing faker argument validation in action.
 * This file is for development/testing purposes only.
 */

import { validateFakerArguments } from './faker-argument-validator';

export function runFakerValidationDemo() {
  console.log('=== Faker Argument Validation Demo ===\n');

  const testCases = [
    // Valid cases
    {
      method: 'person.firstName',
      args: [],
      description: 'Simple method with no args',
    },
    {
      method: 'string.alpha',
      args: [10],
      description: 'String generation with valid length',
    },
    {
      method: 'number.int',
      args: [{ min: 1, max: 100 }],
      description: 'Number with valid range',
    },
    {
      method: 'date.between',
      args: [{ from: '2020-01-01', to: '2025-01-01' }],
      description: 'Date with valid range',
    },

    // Invalid cases that should be caught
    {
      method: 'string.alpha',
      args: [Number.MAX_SAFE_INTEGER],
      description: 'String with excessive length',
    },
    {
      method: 'number.int',
      args: [{ min: 10, max: 5 }],
      description: 'Number with invalid range (min > max)',
    },
    {
      method: 'date.between',
      args: [{ from: '2025-01-01', to: '2020-01-01' }],
      description: 'Date with invalid range',
    },
    {
      method: 'string.alpha',
      args: [null],
      description: 'String with null argument',
    },
    {
      method: 'nonexistent.method',
      args: [],
      description: 'Non-existent faker method',
    },

    // Edge cases
    {
      method: 'string.alpha',
      args: [0],
      description: 'String with zero length',
    },
    {
      method: 'string.alpha',
      args: [-1],
      description: 'String with negative length',
    },
    {
      method: 'helpers.arrayElements',
      args: [['a', 'b', 'c'], 2],
      description: 'Array selection with valid count',
    },
  ];

  const mockLogger = {
    debug: (msg: string) => console.log(`[DEBUG] ${msg}`),
  };

  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.description}`);
    console.log(`   Method: ${testCase.method}`);
    console.log(`   Args: ${JSON.stringify(testCase.args)}`);

    const result = validateFakerArguments(testCase.method, testCase.args, {
      timeoutMs: 100,
      logPerformance: true,
      logger: mockLogger,
    });

    if (result.isValid) {
      console.log(`   ✅ VALID (${result.executionTimeMs}ms)`);
    } else {
      console.log(
        `   ❌ INVALID: ${result.error} (${result.executionTimeMs}ms)`
      );
    }
  });

  console.log('\n=== Performance Comparison ===\n');

  // Test performance with different argument sizes
  const performanceTests = [
    { method: 'string.alpha', args: [10], label: 'Small string (10 chars)' },
    { method: 'string.alpha', args: [1000], label: 'Medium string (1K chars)' },
    {
      method: 'string.alpha',
      args: [10000],
      label: 'Large string (10K chars)',
    },
    {
      method: 'helpers.arrayElements',
      args: [Array.from({ length: 100 }, (_, i) => i), 50],
      label: 'Array selection (100 items)',
    },
    {
      method: 'date.betweens',
      args: [{ from: '2020-01-01', to: '2025-01-01', count: 100 }],
      label: 'Multiple dates (100 dates)',
    },
  ];

  performanceTests.forEach((test) => {
    const iterations = 10;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const result = validateFakerArguments(test.method, test.args);
      if (result.isValid && result.executionTimeMs !== undefined) {
        times.push(result.executionTimeMs);
      }
    }

    if (times.length > 0) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);
      console.log(
        `${test.label}: avg=${avg.toFixed(2)}ms, min=${min}ms, max=${max}ms`
      );
    }
  });

  console.log('\n=== Demo Complete ===');
}

// Run the demo:
runFakerValidationDemo();

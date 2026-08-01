import { expect } from 'chai';
import { setupCodemirrorLinter } from '../../test/linter';
import { createSafeIntegerLinter } from './safe-integer-linter';

describe('createSafeIntegerLinter', function () {
  const violations: { from: number; to: number; source: string }[] = [];

  const lint = setupCodemirrorLinter(
    createSafeIntegerLinter({
      delay: 0,
      onViolation: (from, to, source) => {
        violations.push({ from, to, source });
        return {
          from,
          to,
          severity: 'error',
          message: 'Exceeds safe integer range.',
          source,
        };
      },
    })
  );

  beforeEach(function () {
    violations.length = 0;
  });

  it('does not flag a safe integer', function () {
    lint('{ a: 123 }');
    expect(violations).to.have.lengthOf(0);
  });

  it('does not flag Number.MAX_SAFE_INTEGER', function () {
    lint(`{ a: ${Number.MAX_SAFE_INTEGER} }`);
    expect(violations).to.have.lengthOf(0);
  });

  it('does not flag Number.MIN_SAFE_INTEGER', function () {
    lint(`{ a: ${Number.MIN_SAFE_INTEGER} }`);
    expect(violations).to.have.lengthOf(0);
  });

  it('flags an integer larger than MAX_SAFE_INTEGER', function () {
    const source = Number.MAX_SAFE_INTEGER + 1;
    lint(`{ a: ${source} }`);
    expect(violations).to.have.lengthOf(1);
    expect(violations[0].source).to.equal(String(source));
  });

  it('reports multiple offending literals - different values', function () {
    const source1 = Number.MAX_SAFE_INTEGER + 1;
    const source2 = Number.MAX_SAFE_INTEGER + 10;
    lint(`{ a: ${source1}, b: ${source2} }`);
    expect(violations).to.have.lengthOf(2);
    expect(violations[0].source).to.equal(String(source1));
    expect(violations[1].source).to.equal(String(source2));
  });

  it('flags multiple offending integers - same value', function () {
    const big = String(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
    lint(`{ a: ${big}, b: ${big} }`);
    expect(violations).to.have.lengthOf(2);
  });

  it('does not flag a number wrapped in a constructor call', function () {
    const source = Number.MAX_SAFE_INTEGER + 1;
    lint(`{ a: Long(${source}) }`);
    expect(violations).to.have.lengthOf(0);
  });

  it('does not flag a non-integer number (float)', function () {
    lint('{ a: 1.5 }');
    expect(violations).to.have.lengthOf(0);
  });
});

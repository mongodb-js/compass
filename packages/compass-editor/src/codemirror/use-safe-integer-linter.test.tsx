import React, { useRef, useState, useEffect, createRef } from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import { render, waitFor } from '@mongodb-js/testing-library-compass';
import { CodemirrorMultilineEditor } from '../editor';
import type { EditorRef } from '../types';
import {
  useSafeIntegerLinter,
  type SafeIntegerViolation,
} from './use-safe-integer-linter';

type TestEditorHandle = {
  getViolations: () => SafeIntegerViolation[];
  getText: () => string;
  fixViolations: () => void;
};

function TestEditor({
  initialText,
  onFixViolation,
  onViolationFixed = () => undefined,
  handleRef,
}: {
  initialText: string;
  onFixViolation?: (source: string) => string;
  onViolationFixed?: () => void;
  handleRef: { current: TestEditorHandle | null };
}) {
  const editorRef = useRef<EditorRef>(null);
  const [text, setText] = useState(initialText);
  const { safeIntegerLinter, violations, onFixViolations } =
    useSafeIntegerLinter({
      editorRef,
      onFixViolation,
      onViolationFixed,
      lintDelay: 0,
    });

  useEffect(() => {
    handleRef.current = {
      getViolations: () => violations,
      getText: () => text,
      fixViolations: onFixViolations,
    };
  }, [violations, text, onFixViolations, handleRef]);

  return (
    <CodemirrorMultilineEditor
      ref={editorRef}
      language="javascript-expression"
      text={text}
      onChangeText={setText}
      linter={safeIntegerLinter}
    />
  );
}

function renderTestEditor(
  text: string,
  onFixViolation?: (source: string) => string,
  onViolationFixed?: () => void
) {
  const handleRef = createRef<TestEditorHandle>();
  render(
    <TestEditor
      initialText={text}
      onFixViolation={onFixViolation}
      onViolationFixed={onViolationFixed}
      handleRef={handleRef}
    />
  );
  return () => {
    if (!handleRef.current) {
      throw new Error('editor did not render');
    }
    return handleRef.current;
  };
}

async function expectFix(text: string, expected: string) {
  const handle = renderTestEditor(text);
  await waitFor(() => {
    expect(handle().getViolations()).to.have.lengthOf(1);
  });

  handle().fixViolations();

  await waitFor(() => {
    expect(handle().getText()).to.equal(expected);
  });
}

const UNSAFE_MAX = String(BigInt(Number.MAX_SAFE_INTEGER) + 1n);
const UNSAFE_MIN = String(BigInt(Number.MIN_SAFE_INTEGER) - 1n);

describe('useSafeIntegerLinter', function () {
  it('flags an integer larger than MAX_SAFE_INTEGER', async function () {
    const handle = renderTestEditor(`{ a: ${UNSAFE_MAX} }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(1);
    });
    const [violation] = handle().getViolations();
    expect(handle().getText().slice(violation.from, violation.to)).to.equal(
      UNSAFE_MAX
    );
  });

  it('flags an integer smaller than MIN_SAFE_INTEGER', async function () {
    const handle = renderTestEditor(`{ a: ${UNSAFE_MIN} }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(1);
    });
  });

  it('does not flag a safe integer', async function () {
    const handle = renderTestEditor('{ a: 123 }');
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(0);
    });
  });

  it('does not flag Number.MAX_SAFE_INTEGER', async function () {
    const handle = renderTestEditor(`{ a: ${Number.MAX_SAFE_INTEGER} }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(0);
    });
  });

  it('does not flag Number.MIN_SAFE_INTEGER', async function () {
    const handle = renderTestEditor(`{ a: ${Number.MIN_SAFE_INTEGER} }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(0);
    });
  });

  it('does not flag a non-integer number (float)', async function () {
    const handle = renderTestEditor('{ a: 1.5 }');
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(0);
    });
  });

  it('flags an unsafe bare number passed as a constructor argument', async function () {
    // `Long(9007...)` still loses precision: the literal is parsed as a JS
    // double before Long sees it. Only a string argument is safe.
    const handle = renderTestEditor(`{ a: Long(${UNSAFE_MAX}) }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(1);
    });
  });

  it('does not flag a string argument to a constructor call', async function () {
    const handle = renderTestEditor(`{ a: Long("${UNSAFE_MAX}") }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(0);
    });
  });

  it('reports multiple offending literals - different values', async function () {
    const other = String(BigInt(Number.MAX_SAFE_INTEGER) + 10n);
    const handle = renderTestEditor(`{ a: ${UNSAFE_MAX}, b: ${other} }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(2);
    });
    const [first, second] = handle().getViolations();
    const text = handle().getText();
    expect(text.slice(first.from, first.to)).to.equal(UNSAFE_MAX);
    expect(text.slice(second.from, second.to)).to.equal(other);
  });

  it('reports multiple offending literals - same value', async function () {
    const handle = renderTestEditor(`{ a: ${UNSAFE_MAX}, b: ${UNSAFE_MAX} }`);
    await waitFor(() => {
      expect(handle().getViolations()).to.have.lengthOf(2);
    });
  });

  describe('onFixViolations', function () {
    it('wraps every violation in Long() by default', async function () {
      const handle = renderTestEditor(`{ a: ${UNSAFE_MAX}, b: ${UNSAFE_MAX} }`);
      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(2);
      });

      handle().fixViolations();

      await waitFor(() => {
        expect(handle().getText()).to.equal(
          `{ a: Long("${UNSAFE_MAX}"), b: Long("${UNSAFE_MAX}") }`
        );
        expect(handle().getViolations()).to.have.lengthOf(0);
      });
    });

    it('uses a custom onFixViolation when provided', async function () {
      const handle = renderTestEditor(
        `{ a: ${UNSAFE_MAX} }`,
        (source) => `{$numberLong: "${source}"}`
      );
      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(1);
      });

      handle().fixViolations();

      await waitFor(() => {
        expect(handle().getText()).to.equal(
          `{ a: {$numberLong: "${UNSAFE_MAX}"} }`
        );
      });
    });

    it('is a no-op when there are no violations', async function () {
      const handle = renderTestEditor('{ a: 123 }');
      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(0);
      });

      handle().fixViolations();

      expect(handle().getText()).to.equal('{ a: 123 }');
    });
  });

  describe('calls that accept a string argument', function () {
    // `Long(123...)` must become `Long("123...")`, not `Long(Long("123..."))`.
    for (const constructor of [
      'Long',
      'NumberLong',
      'Int64',
      'Decimal128',
      'NumberDecimal',
    ]) {
      it(`quotes the argument to ${constructor}()`, async function () {
        await expectFix(
          `{ a: ${constructor}(${UNSAFE_MAX}) }`,
          `{ a: ${constructor}("${UNSAFE_MAX}") }`
        );
      });
    }

    it('quotes the argument to a new expression', async function () {
      await expectFix(
        `{ a: new Long(${UNSAFE_MAX}) }`,
        `{ a: new Long("${UNSAFE_MAX}") }`
      );
    });

    it('clears the violation once the argument is quoted', async function () {
      const handle = renderTestEditor(`{ a: Long(${UNSAFE_MAX}) }`);
      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(1);
      });

      handle().fixViolations();

      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(0);
      });
    });
  });

  describe('calls that do not accept a string argument', function () {
    it('wraps a Date argument', async function () {
      await expectFix(
        `{ a: Date(${UNSAFE_MAX}) }`,
        `{ a: Date(Long("${UNSAFE_MAX}")) }`
      );
    });

    it('wraps a Timestamp argument', async function () {
      await expectFix(
        `{ a: Timestamp(${UNSAFE_MAX}, 1) }`,
        `{ a: Timestamp(Long("${UNSAFE_MAX}"), 1) }`
      );
    });

    it('wraps a NumberInt argument, which a string would still overflow', async function () {
      await expectFix(
        `{ a: NumberInt(${UNSAFE_MAX}) }`,
        `{ a: NumberInt(Long("${UNSAFE_MAX}")) }`
      );
    });

    it('wraps a Double argument, which a string would still round', async function () {
      await expectFix(
        `{ a: Double(${UNSAFE_MAX}) }`,
        `{ a: Double(Long("${UNSAFE_MAX}")) }`
      );
    });

    it('wraps an argument to a method that only shares a constructor name', async function () {
      await expectFix(
        `{ a: bson.Long(${UNSAFE_MAX}) }`,
        `{ a: bson.Long(Long("${UNSAFE_MAX}")) }`
      );
    });
  });

  describe('onViolationFixed', function () {
    async function fixAndCountReports(text: string) {
      const onViolationFixed = sinon.spy();
      const handle = renderTestEditor(text, undefined, onViolationFixed);
      await waitFor(() => {
        expect(handle().getViolations()).to.not.be.empty;
      });

      handle().fixViolations();

      await waitFor(() => {
        expect(handle().getViolations()).to.be.empty;
      });
      return onViolationFixed.callCount;
    }

    it('reports every violation fixed by wrapping', async function () {
      expect(
        await fixAndCountReports(`{ a: ${UNSAFE_MAX}, b: ${UNSAFE_MAX} }`)
      ).to.equal(2);
    });

    it('reports a violation fixed by quoting in place', async function () {
      expect(await fixAndCountReports(`{ a: Long(${UNSAFE_MAX}) }`)).to.equal(
        1
      );
    });

    it('reports a mix of quoted and wrapped violations', async function () {
      expect(
        await fixAndCountReports(`{ a: Long(${UNSAFE_MAX}), b: ${UNSAFE_MAX} }`)
      ).to.equal(2);
    });

    it('is not called when there is nothing to fix', async function () {
      const onViolationFixed = sinon.spy();
      const handle = renderTestEditor(
        '{ a: 123 }',
        undefined,
        onViolationFixed
      );
      await waitFor(() => {
        expect(handle().getViolations()).to.be.empty;
      });

      handle().fixViolations();

      expect(onViolationFixed.callCount).to.equal(0);
    });
  });

  describe('negative numbers', function () {
    it('includes the sign in the violation range', async function () {
      const handle = renderTestEditor(`{ a: -${UNSAFE_MAX} }`);
      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(1);
      });
      const [violation] = handle().getViolations();
      expect(handle().getText().slice(violation.from, violation.to)).to.equal(
        `-${UNSAFE_MAX}`
      );
    });

    it('wraps the sign along with the digits', async function () {
      await expectFix(`{ a: -${UNSAFE_MAX} }`, `{ a: Long("-${UNSAFE_MAX}") }`);
    });

    it('wraps a sign separated from its digits', async function () {
      await expectFix(
        `{ a: - ${UNSAFE_MAX} }`,
        `{ a: Long("-${UNSAFE_MAX}") }`
      );
    });

    it('quotes a negative argument to a string constructor', async function () {
      await expectFix(
        `{ a: Long(-${UNSAFE_MAX}) }`,
        `{ a: Long("-${UNSAFE_MAX}") }`
      );
    });

    it('leaves a subtraction operator out of the fix', async function () {
      await expectFix(
        `{ a: x - ${UNSAFE_MAX} }`,
        `{ a: x - Long("${UNSAFE_MAX}") }`
      );
    });
  });
});

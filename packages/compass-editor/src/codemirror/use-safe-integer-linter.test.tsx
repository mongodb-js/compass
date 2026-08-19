import React, { useRef, useState, useEffect, createRef } from 'react';
import { expect } from 'chai';
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
  handleRef,
}: {
  initialText: string;
  onFixViolation?: (source: string) => string;
  handleRef: { current: TestEditorHandle | null };
}) {
  const editorRef = useRef<EditorRef>(null);
  const [text, setText] = useState(initialText);
  const { safeIntegerLinter, violations, onFixViolations } =
    useSafeIntegerLinter({
      editorRef,
      onFixViolation,
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
  onFixViolation?: (source: string) => string
) {
  const handleRef = createRef<TestEditorHandle>();
  render(
    <TestEditor
      initialText={text}
      onFixViolation={onFixViolation}
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

    it('quotes the argument when the number is already in a constructor call', async function () {
      // `Long(123...)` must become `Long("123...")`, not `Long(Long("123..."))`.
      const handle = renderTestEditor(`{ a: Long(${UNSAFE_MAX}) }`);
      await waitFor(() => {
        expect(handle().getViolations()).to.have.lengthOf(1);
      });

      handle().fixViolations();

      await waitFor(() => {
        expect(handle().getText()).to.equal(`{ a: Long("${UNSAFE_MAX}") }`);
        expect(handle().getViolations()).to.have.lengthOf(0);
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
});

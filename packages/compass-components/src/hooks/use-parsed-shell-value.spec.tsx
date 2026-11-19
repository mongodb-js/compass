import React from 'react';
import { expect } from 'chai';
import { render, screen, waitFor } from '@mongodb-js/testing-library-compass';

import { useParsedShellValue } from './use-parsed-shell-value';
import type { ParsedShellValue } from './use-parsed-shell-value';

function TestComponent({
  source,
  onRender,
}: {
  source: string;
  onRender?: (result: ParsedShellValue) => void;
}) {
  const result = useParsedShellValue(source);
  onRender?.(result);
  return (
    <div>
      {result.pending && <span data-testid="pending">pending</span>}
      {result.error && (
        <span data-testid="error">error: {result.error.message}</span>
      )}
      {!!result.value && (
        <span data-testid="value">{JSON.stringify(result.value)}</span>
      )}
    </div>
  );
}

describe('useParsedShellValue', function () {
  it('parses shell syntax and stops being pending', async function () {
    const renders: ParsedShellValue[] = [];
    render(
      <TestComponent
        source="{ a: 1 } // comment"
        onRender={(result) => renders.push(result)}
      />
    );

    expect(renders.at(-1)).to.have.property('pending', true);
    await waitFor(() => {
      expect(screen.getByTestId('value')).to.have.text('{"a":1}');
    });
    expect(renders.at(-1)).to.have.property('pending', false);
  });

  it('exposes a parse failure as an error', async function () {
    render(<TestComponent source="{ invalid bson }" />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).to.exist;
    });
    expect(screen.queryByTestId('pending')).to.not.exist;
  });

  it('treats a primitive result as an error', async function () {
    render(<TestComponent source="42" />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).to.have.text(
        'error: Source expression is invalid'
      );
    });
  });

  it('is pending on the render where the source changes and keeps the last value', async function () {
    const renders: ParsedShellValue[] = [];
    const onRender = (result: ParsedShellValue) => renders.push(result);
    const { rerender } = render(
      <TestComponent source="{ a: 1 }" onRender={onRender} />
    );
    await waitFor(() => {
      expect(screen.getByTestId('value')).to.have.text('{"a":1}');
    });

    renders.length = 0;
    rerender(<TestComponent source="{ a: 2 }" onRender={onRender} />);

    expect(renders[0]).to.deep.include({ pending: true, value: { a: 1 } });
    await waitFor(() => {
      expect(screen.getByTestId('value')).to.have.text('{"a":2}');
    });
    expect(renders.at(-1)).to.have.property('pending', false);
  });
});

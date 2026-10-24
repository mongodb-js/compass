import React from 'react';
import { expect } from 'chai';
import {
  act,
  render,
  screen,
  waitFor,
} from '@mongodb-js/testing-library-compass';

import { useAsyncValue } from './use-async-value';
import type { AsyncValueResult } from './use-async-value';

async function settle(fn: () => void) {
  await act(async () => {
    fn();
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function TestComponent<T>({
  task,
  deps,
  onRender,
}: {
  task: () => Promise<T>;
  deps: React.DependencyList;
  onRender: (result: AsyncValueResult<T>) => void;
}) {
  const result = useAsyncValue(task, deps);
  onRender(result);
  return (
    <div>
      {result.pending && <span data-testid="pending">pending</span>}
      {result.error && (
        <span data-testid="error">error: {result.error.message}</span>
      )}
      {result.value && (
        <span data-testid="value">{JSON.stringify(result.value)}</span>
      )}
    </div>
  );
}

describe('useAsyncValue', function () {
  it('resolves the task and stops being pending', async function () {
    const renders: AsyncValueResult<string>[] = [];
    render(
      <TestComponent
        task={() => Promise.resolve('parsed')}
        deps={['a']}
        onRender={(result) => renders.push(result)}
      />
    );

    expect(renders.at(-1)).to.have.property('pending', true);

    await waitFor(() => {
      expect(screen.getByTestId('value')).to.have.text('"parsed"');
    });
    expect(renders.at(-1)).to.have.property('pending', false);
    expect(renders.at(-1)).to.have.property('value', 'parsed');
  });

  it('exposes a failed task as an error', async function () {
    render(
      <TestComponent
        task={() => Promise.reject(new Error('invalid'))}
        deps={['a']}
        onRender={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).to.have.text('error: invalid');
    });
  });

  it('wraps a non-Error rejection', async function () {
    render(
      <TestComponent
        task={() => Promise.reject('nope')}
        deps={['a']}
        onRender={() => {}}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('error')).to.have.text('error: nope');
    });
  });

  it('is pending on the render where the deps change, before the effect runs', async function () {
    const renders: AsyncValueResult<string>[] = [];
    const { rerender } = render(
      <TestComponent
        task={() => Promise.resolve('first')}
        deps={['a']}
        onRender={(result) => renders.push(result)}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('value')).to.have.text('"first"');
    });

    renders.length = 0;
    rerender(
      <TestComponent
        task={() => Promise.resolve('second')}
        deps={['b']}
        onRender={(result) => renders.push(result)}
      />
    );

    // First render after the change: the old value is still there, but it is
    // already marked as not belonging to the current input.
    expect(renders[0]).to.have.property('pending', true);
    expect(renders[0]).to.have.property('value', 'first');
  });

  it('keeps the value of the last finished run and drops superseded results', async function () {
    const resolvers: Array<(value: string) => void> = [];
    const task = () =>
      new Promise<string>((resolve) => {
        resolvers.push(resolve);
      });
    const { rerender } = render(
      <TestComponent task={task} deps={['a']} onRender={() => {}} />
    );
    await waitFor(() => expect(resolvers).to.have.lengthOf(1));

    // Start a second run while the first is still in flight.
    rerender(<TestComponent task={task} deps={['b']} onRender={() => {}} />);
    await waitFor(() => expect(resolvers).to.have.lengthOf(2));

    // The first run finishes last: its result must be ignored.
    resolvers[1]('second');
    await waitFor(() => {
      expect(screen.getByTestId('value')).to.have.text('"second"');
    });
    await settle(() => resolvers[0]('first'));
    expect(screen.getByTestId('value')).to.have.text('"second"');
  });

  it('ignores a result that arrives after unmount', async function () {
    let resolveTask: (value: string) => void = () => {};
    let renderCount = 0;
    const { unmount } = render(
      <TestComponent
        task={() =>
          new Promise<string>((resolve) => {
            resolveTask = resolve;
          })
        }
        deps={['a']}
        onRender={() => renderCount++}
      />
    );

    unmount();
    const renderCountAtUnmount = renderCount;
    await settle(() => resolveTask('late'));
    expect(renderCount).to.equal(renderCountAtUnmount);
  });
});

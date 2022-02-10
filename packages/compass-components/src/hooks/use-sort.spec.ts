import { expect } from 'chai';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook } from '@testing-library/react-hooks';
import { useSortControls, useSortedItems } from './use-sort';

const sortBy = [
  {
    name: 'title',
    label: 'Title',
  },
  {
    name: 'age',
    label: 'Age',
  },
];

const items = [
  {
    title: 'Compass',
    age: 6,
  },
  {
    title: 'Mongosh',
    age: 2,
  },
];

describe('use-sort', function () {
  it('should render sort select', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    expect(screen.getByText('Title'), 'Title is the default sort').to.exist;
    userEvent.click(screen.getByText('Title'), undefined, {
      skipPointerEventsCheck: true,
    });
    ['Title', 'Age'].forEach((item) => {
      expect(
        screen.getByText(item, {
          selector: 'span',
        }),
        `it shows ${item} sort option`
      ).to.exist;
    });
  });

  it('should render sort select in disabled state', function () {
    const { result } = renderHook(() =>
      useSortControls(sortBy, { isDisabled: true })
    );
    render(result.current[0]);

    expect(
      screen
        .getByRole('button', {
          name: /title/i,
        })
        .hasAttribute('disabled')
    ).to.be.true;
  });

  it('sorts by string value - asc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    // Opens dropdown
    userEvent.click(
      screen.getByRole('button', {
        name: /title/i,
      }),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );

    userEvent.click(
      screen.getByRole('option', {
        name: /title/i,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    const {
      result: { current: sortedItems },
    } = renderHook(() => useSortedItems(items, result.current[1]));
    expect(sortedItems).to.deep.equal([items[0], items[1]]);
  });

  it('sorts by string value - desc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    userEvent.click(screen.getByTitle(/sortascending/i));

    const {
      result: { current: sortedItems },
    } = renderHook(() => useSortedItems(items, result.current[1]));
    expect(sortedItems).to.deep.equal([items[1], items[0]]);
  });

  it('sorts by number value - asc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    // Opens dropdown
    userEvent.click(
      screen.getByRole('button', {
        name: /title/i,
      }),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );

    // Select age
    userEvent.click(
      screen.getByRole('option', {
        name: /age/i,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    const {
      result: { current: sortedItems },
    } = renderHook(() => useSortedItems(items, result.current[1]));
    expect(sortedItems).to.deep.equal([items[1], items[0]]);
  });

  it('sorts by number value - desc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    // Opens dropdown
    userEvent.click(
      screen.getByRole('button', {
        name: /title/i,
      }),
      undefined,
      {
        skipPointerEventsCheck: true,
      }
    );

    // Select age
    userEvent.click(
      screen.getByRole('option', {
        name: /age/i,
      }),
      undefined,
      { skipPointerEventsCheck: true }
    );

    userEvent.click(screen.getByTitle(/sortascending/i));

    const {
      result: { current: sortedItems },
    } = renderHook(() => useSortedItems(items, result.current[1]));
    expect(sortedItems).to.deep.equal([items[0], items[1]]);
  });

  it('should not sort when disabled', function () {
    const { result } = renderHook(() =>
      useSortControls(sortBy, { isDisabled: true })
    );
    render(result.current[0]);

    const {
      result: { current: sortedItems },
    } = renderHook(() => useSortedItems(items, result.current[1]));
    expect(sortedItems).to.deep.equal(items);
  });
});

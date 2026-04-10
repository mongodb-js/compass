import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  userEvent,
  renderHook,
} from '@mongodb-js/testing-library-compass';
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
          name: 'Sort by',
        })
        .getAttribute('aria-disabled')
    ).to.equal('true');
  });

  it('sorts by string value - asc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    // Opens dropdown
    userEvent.click(
      screen.getByRole('button', {
        name: 'Sort by',
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
    } = renderHook(() =>
      useSortedItems(items as Record<string, unknown>[], result.current[1])
    );
    expect(sortedItems).to.deep.equal([items[0], items[1]]);
  });

  it('sorts by string value - desc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    userEvent.click(screen.getByTitle(/sortascending/i));

    const {
      result: { current: sortedItems },
    } = renderHook(() =>
      useSortedItems(items as Record<string, unknown>[], result.current[1])
    );
    expect(sortedItems).to.deep.equal([items[1], items[0]]);
  });

  it('sorts by number value - asc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    // Opens dropdown
    userEvent.click(
      screen.getByRole('button', {
        name: 'Sort by',
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
    } = renderHook(() =>
      useSortedItems(items as Record<string, unknown>[], result.current[1])
    );
    expect(sortedItems).to.deep.equal([items[1], items[0]]);
  });

  it('sorts by number value - desc', function () {
    const { result } = renderHook(() => useSortControls(sortBy));
    render(result.current[0]);

    // Opens dropdown
    userEvent.click(
      screen.getByRole('button', {
        name: 'Sort by',
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
    } = renderHook(() =>
      useSortedItems(items as Record<string, unknown>[], result.current[1])
    );
    expect(sortedItems).to.deep.equal([items[0], items[1]]);
  });

  it('should not sort when disabled', function () {
    const { result } = renderHook(() =>
      useSortControls(sortBy, { isDisabled: true })
    );
    render(result.current[0]);

    const {
      result: { current: sortedItems },
    } = renderHook(() =>
      useSortedItems(items as Record<string, unknown>[], result.current[1])
    );
    expect(sortedItems).to.deep.equal(items);
  });

  describe('persistId', function () {
    let localStorageValues: Record<string, string>;

    beforeEach(function () {
      localStorageValues = {};
      sinon.stub(global, 'localStorage').value({
        getItem: sinon.fake((key: string) => {
          return localStorageValues[key] ?? null;
        }),
        setItem: sinon.fake((key: string, value: any) => {
          localStorageValues[key] = value.toString();
        }),
      });
    });

    afterEach(function () {
      sinon.restore();
    });

    it('should update localStorage when sort order changes', function () {
      const { result } = renderHook(() =>
        useSortControls(sortBy, { persistId: 'test-order' })
      );
      render(result.current[0]);

      userEvent.click(screen.getByTitle(/sortascending/i));

      const { result: reRenderedResult } = renderHook(() =>
        useSortControls(sortBy, { persistId: 'test-order' })
      );
      expect(reRenderedResult.current[1]).to.deep.equal({
        name: 'title',
        order: -1,
      });
      const stored = JSON.parse(localStorageValues['compass-sort-test-order']);
      expect(stored).to.deep.equal({ name: 'title', order: -1 });
    });

    it('should restore sort state from localStorage', function () {
      localStorageValues['compass-sort-test-persist'] = JSON.stringify({
        name: 'age',
        order: -1,
      });

      const { result } = renderHook(() =>
        useSortControls(sortBy, { persistId: 'test-persist' })
      );

      expect(result.current[1]).to.deep.equal({ name: 'age', order: -1 });
    });

    it('should not persist when persistId is not provided', function () {
      renderHook(() => useSortControls(sortBy));

      expect(localStorageValues['compass-sort-test-no-persist']).to.be
        .undefined;
    });
  });
});

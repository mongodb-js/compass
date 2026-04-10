import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  userEvent,
  renderHook,
  waitFor,
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

  it('should call onChange when sort order changes', async function () {
    const onChangeStub = sinon.stub();
    const { result } = renderHook(() =>
      useSortControls(sortBy, {
        initialState: { name: 'title', order: 1 },
        onChange: onChangeStub,
      })
    );
    render(result.current[0]);

    expect(onChangeStub.called).to.be.false;

    userEvent.click(screen.getByTitle(/sortascending/i));

    await waitFor(() => {
      expect(onChangeStub.calledOnceWith({ name: 'title', order: -1 })).to.be
        .true;
    });
  });

  it('should use initial state when provided', function () {
    const { result } = renderHook(() =>
      useSortControls(sortBy, { initialState: { name: 'age', order: -1 } })
    );
    render(result.current[0]);

    expect(screen.queryByText('Title'), 'Title should not exist').to.not.exist;
    expect(screen.getByText('Age'), 'Age is the initial sort').to.be.visible;
  });
});

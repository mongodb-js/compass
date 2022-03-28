import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { useVirtualGridArrowNavigation } from './use-virtual-grid';

const TestGrid: React.FunctionComponent<{
  rowCount?: number;
  colCount?: number;
  onFocusMove?: (id: number) => void;
  defaultCurrentTabbable?: number;
}> = ({
  rowCount = 5,
  colCount = 3,
  onFocusMove = () => {
    /* noop */
  },
  defaultCurrentTabbable,
}) => {
  const [arrowNavigationProps, currentTabbable] =
    useVirtualGridArrowNavigation<HTMLDivElement>({
      rowCount,
      colCount,
      itemsCount: rowCount * colCount,
      defaultCurrentTabbable,
      onFocusMove,
    });

  return (
    <div role="grid" aria-rowcount={rowCount} {...arrowNavigationProps}>
      {Array.from({ length: rowCount }, (_, row) => (
        <div key={row} role="row" aria-rowindex={row + 1}>
          {Array.from({ length: colCount }, (_, col) => {
            const idx = row * colCount + col;
            return (
              <div
                role="cell"
                data-vlist-item-idx={idx}
                tabIndex={currentTabbable === idx ? 0 : -1}
              >
                {row + 1}-{col + 1}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

describe('virtual grid keyboard navigation', function () {
  let originalRequestAnimationFrame: typeof globalThis.requestAnimationFrame;

  before(function () {
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    (globalThis as any).requestAnimationFrame = (fn: () => void) => fn();
  });

  after(function () {
    (globalThis as any).requestAnimationFrame = originalRequestAnimationFrame;
  });

  afterEach(cleanup);

  it('should move focus to the first tabbable element on focus', function () {
    render(<TestGrid></TestGrid>);
    userEvent.tab();
    expect(screen.getByText('1-1')).to.eq(document.activeElement);
  });

  describe('Right Arrow', function () {
    it('should move focus one cell to the right', function () {
      render(<TestGrid></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowright}');
      expect(screen.getByText('1-2')).to.eq(document.activeElement);
    });

    it('when focus is on the right-most cell in the row, should move focus to the first cell in the following row', function () {
      render(<TestGrid defaultCurrentTabbable={2}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-3')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowright}');
      expect(screen.getByText('2-1')).to.eq(document.activeElement);
    });

    it('when focus is on the last cell in the grid, focus should not move', function () {
      render(<TestGrid defaultCurrentTabbable={14}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('5-3')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowright}');
      expect(screen.getByText('5-3')).to.eq(document.activeElement);
    });
  });

  describe('Left Arrow', function () {
    it('should move focus one cell to the left', function () {
      render(<TestGrid defaultCurrentTabbable={1}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-2')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowleft}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });

    it('when focus is on the left-most cell in the row, should move focus to the last cell in the previous row', function () {
      render(<TestGrid defaultCurrentTabbable={3}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('2-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowleft}');
      expect(screen.getByText('1-3')).to.eq(document.activeElement);
    });

    it('when focus is on the first cell in the grid, focus should not move', function () {
      render(<TestGrid></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowleft}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });
  });

  describe('Down Arrow', function () {
    it('should move focus to the next logical row', function () {
      render(<TestGrid></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowdown}');
      expect(screen.getByText('2-1')).to.eq(document.activeElement);
    });

    it('when focus is in the last logical row, focus should not move', function () {
      render(<TestGrid defaultCurrentTabbable={12}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('5-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowdown}');
      expect(screen.getByText('5-1')).to.eq(document.activeElement);
    });

    it('when there is only one logical row, focus moves to the next cell', function () {
      render(<TestGrid rowCount={1}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowdown}');
      expect(screen.getByText('1-2')).to.eq(document.activeElement);
    });
  });

  describe('Up Arrow', function () {
    it('should move focus to the previous logical row', function () {
      render(<TestGrid defaultCurrentTabbable={3}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('2-1')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowup}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });

    it('when focus is in the first logical row, focus should not move', function () {
      render(<TestGrid defaultCurrentTabbable={1}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-2')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowup}');
      expect(screen.getByText('1-2')).to.eq(document.activeElement);
    });

    it('when there is only one logical row, should move focus to the previous cell', function () {
      render(<TestGrid rowCount={1} defaultCurrentTabbable={1}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-2')).to.eq(document.activeElement);
      userEvent.keyboard('{arrowup}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });
  });

  describe('Page Down', function () {
    it('should move focus 3 rows down', function () {
      render(<TestGrid></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
      userEvent.keyboard('{pagedown}');
      expect(screen.getByText('4-1')).to.eq(document.activeElement);
    });

    it('when focus is in the last row, focus should not move', function () {
      render(<TestGrid defaultCurrentTabbable={12}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('5-1')).to.eq(document.activeElement);
      userEvent.keyboard('{pagedown}');
      expect(screen.getByText('5-1')).to.eq(document.activeElement);
    });
  });

  describe('Page Up', function () {
    it('should move focus 3 rows up', function () {
      render(<TestGrid defaultCurrentTabbable={9}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('4-1')).to.eq(document.activeElement);
      userEvent.keyboard('{pageup}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });

    it('when focus is in the first row, focus should not move', function () {
      render(<TestGrid></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
      userEvent.keyboard('{pageup}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });
  });

  describe('Home', function () {
    it('should move focus to the first cell in the row that contains focus', function () {
      render(<TestGrid defaultCurrentTabbable={4}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('2-2')).to.eq(document.activeElement);
      userEvent.keyboard('{home}');
      expect(screen.getByText('2-1')).to.eq(document.activeElement);
    });
  });

  describe('End', function () {
    it('should move focus to the last cell in the row that contains focus', function () {
      render(<TestGrid defaultCurrentTabbable={4}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('2-2')).to.eq(document.activeElement);
      userEvent.keyboard('{end}');
      expect(screen.getByText('2-3')).to.eq(document.activeElement);
    });
  });

  describe('Control + Home', function () {
    it('should move focus to the first cell in the first row', function () {
      render(<TestGrid defaultCurrentTabbable={4}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('2-2')).to.eq(document.activeElement);
      userEvent.keyboard('{ctrl}{home}{/ctrl}');
      expect(screen.getByText('1-1')).to.eq(document.activeElement);
    });
  });

  describe('Control + End', function () {
    it('should move focus to the last cell in the last row', function () {
      render(<TestGrid defaultCurrentTabbable={4}></TestGrid>);
      userEvent.tab();
      expect(screen.getByText('2-2')).to.eq(document.activeElement);
      userEvent.keyboard('{ctrl}{end}{/ctrl}');
      expect(screen.getByText('5-3')).to.eq(document.activeElement);
    });
  });

  it('should keep focus on the element that was interacted with', function () {
    render(<TestGrid></TestGrid>);
    expect(document.body).to.eq(document.activeElement);
    userEvent.click(screen.getByText('2-3'));
    expect(screen.getByText('2-3')).to.eq(document.activeElement);
  });
});

/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable react/prop-types */
import React, { useCallback, useMemo, useState } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { useVirtualNavigationTree } from './use-virtual-navigation-tree';

import type { NavigationTreeData } from './use-virtual-navigation-tree';

function NavigationTreeItem({
  id,
  name,
  level,
  setSize,
  posInSet,
  isExpanded,
  isTabbable,
}: {
  id: string;
  name: string;
  level: number;
  setSize: number;
  posInSet: number;
  isExpanded?: boolean;
  isTabbable?: boolean;
}) {
  return (
    <li
      data-id={id}
      data-testid={id}
      role="treeitem"
      aria-level={level}
      aria-setsize={setSize}
      aria-posinset={posInSet}
      aria-expanded={isExpanded}
      tabIndex={isTabbable ? 0 : -1}
    >
      {name}
    </li>
  );
}

type MockItem = { id: string; items?: MockItem[] };

const items = [
  {
    id: 'Fruits',
    items: [
      { id: 'Oranges' },
      { id: 'Pineapples' },
      { id: 'Apples', items: [{ id: 'Macintosh' }, { id: 'Granny Smith' }] },
      { id: 'Bananas' },
    ],
  },
  {
    id: 'Vegetables',
    items: [
      {
        id: 'Podded Vegetables',
        items: [{ id: 'Lentil' }, { id: 'Pea' }, { id: 'Peanut' }],
      },
      { id: 'Bulb and Stem Vegetables', items: [{ id: 'Asparagus' }] },
    ],
  },
];

function normalizeItems(
  items: MockItem[],
  level = 1,
  expanded = []
): NavigationTreeData {
  return items
    .map((item, index) =>
      [
        {
          id: item.id,
          name: item.id,
          level,
          setSize: items.length,
          posInSet: index + 1,
          ...(item.items && { isExpanded: expanded.includes(item.id) }),
        },
      ].concat(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        item.items && expanded.includes(item.id)
          ? normalizeItems(item.items, level + 1, expanded)
          : []
      )
    )
    .flat();
}

function NavigationTree({
  activeItemId,
  defaultExpanded = [],
  onFocusMove = () => {},
}: {
  activeItemId?: string;
  defaultExpanded?: string[];
  onFocusMove?: (item: NavigationTreeData[number]) => void;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const onExpandedChange = useCallback(({ id }, isExpanded) => {
    setExpanded((expanded) =>
      isExpanded ? expanded.concat(id) : expanded.filter((_id) => _id !== id)
    );
  }, []);

  const listItems = useMemo(() => {
    return normalizeItems(items, 1, expanded);
  }, [expanded]);

  const [rootProps, currentTabbable] =
    useVirtualNavigationTree<HTMLUListElement>({
      items: listItems,
      activeItemId,
      onExpandedChange,
      onFocusMove,
    });

  return (
    <ul role="tree" {...rootProps}>
      {(listItems as any[]).map(
        ({ id, name, level, setSize, posInSet, isExpanded }) => {
          return (
            <NavigationTreeItem
              id={id}
              key={id}
              name={name}
              level={level}
              setSize={setSize}
              posInSet={posInSet}
              isExpanded={isExpanded}
              isTabbable={currentTabbable === id}
            ></NavigationTreeItem>
          );
        }
      )}
    </ul>
  );
}

describe('useRovingTabIndex', function () {
  let originalRequestAnimationFrame;

  before(function () {
    originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    (globalThis as any).requestAnimationFrame = (fn) => fn();
  });

  after(function () {
    (globalThis as any).requestAnimationFrame = originalRequestAnimationFrame;
  });

  afterEach(cleanup);

  it('should make first element tabbable when no tabbableSelector provided', function () {
    render(<NavigationTree></NavigationTree>);
    expect(screen.getByText('Fruits')).to.have.attr('tabindex', '0');
  });

  it('should have only one element tabbable when rendered', function () {
    render(<NavigationTree></NavigationTree>);
    const tabbableElements = screen
      .getAllByRole('treeitem')
      .filter((el) => el.tabIndex === 0);
    expect(tabbableElements).to.have.lengthOf(1);
  });

  describe('keyboard list navigation', function () {
    it('should move focus to the next element on ArrowDown', function () {
      render(<NavigationTree></NavigationTree>);
      userEvent.tab();
      userEvent.keyboard('{arrowdown}');
      expect(screen.getByText('Vegetables')).to.eq(document.activeElement);
    });

    it('should move focus to the previous element on ArrowUp', function () {
      render(<NavigationTree activeItemId="Vegetables"></NavigationTree>);
      userEvent.tab();
      userEvent.keyboard('{arrowup}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
    });

    it('should move focus to the last element on End', function () {
      render(<NavigationTree></NavigationTree>);
      userEvent.tab();
      userEvent.keyboard('{end}');
      expect(screen.getByText('Vegetables')).to.eq(document.activeElement);
    });

    it('should move focus to the first element on Home', function () {
      render(<NavigationTree activeItemId="Vegetables"></NavigationTree>);
      userEvent.tab();
      userEvent.keyboard('{home}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
    });

    it('should move focus to the child treeitem on ArrowRight when expandable treeitem is expanded', function () {
      render(<NavigationTree defaultExpanded={['Fruits']}></NavigationTree>);
      userEvent.tab();
      userEvent.keyboard('{arrowright}');
      expect(screen.getByText('Oranges')).to.eq(document.activeElement);
    });

    it('should move focus to the parent treeitem on ArrowLeft when expandable treeitem is collapsed', function () {
      render(
        <NavigationTree
          activeItemId="Bananas"
          defaultExpanded={['Fruits']}
        ></NavigationTree>
      );
      userEvent.tab();
      userEvent.keyboard('{arrowleft}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
    });

    it('should move focus to the next item that starts with the pressed letter', function () {
      render(
        <NavigationTree
          defaultExpanded={['Vegetables', 'Podded Vegetables']}
        ></NavigationTree>
      );
      userEvent.tab();
      userEvent.keyboard('{p}');
      expect(screen.getByText('Podded Vegetables')).to.eq(
        document.activeElement
      );
      userEvent.keyboard('{p}');
      expect(screen.getByText('Pea')).to.eq(document.activeElement);
    });
  });

  describe('keyboard expand / collapse', function () {
    it('should expand collapsed treeitem on ArrowRight and keep the focus on the item', function () {
      render(<NavigationTree></NavigationTree>);
      userEvent.tab();
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'false');
      userEvent.keyboard('{arrowright}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'true');
    });

    it('should collapse expanded treeitem on ArrowLeft and keep the focus on the item', function () {
      render(<NavigationTree defaultExpanded={['Fruits']}></NavigationTree>);
      userEvent.tab();
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'true');
      userEvent.keyboard('{arrowleft}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'false');
    });

    it('should expand all set siblings of a focused element on * press', function () {
      render(
        <NavigationTree
          activeItemId="Podded Vegetables"
          defaultExpanded={['Fruits', 'Vegetables']}
        ></NavigationTree>
      );
      userEvent.tab();
      expect(screen.getByText('Podded Vegetables')).to.have.attr(
        'aria-expanded',
        'false'
      );
      expect(screen.getByText('Bulb and Stem Vegetables')).to.have.attr(
        'aria-expanded',
        'false'
      );
      userEvent.keyboard('*');
      expect(screen.getByText('Podded Vegetables')).to.have.attr(
        'aria-expanded',
        'true'
      );
      expect(screen.getByText('Bulb and Stem Vegetables')).to.have.attr(
        'aria-expanded',
        'true'
      );
      // Checking that another level 2 treeitems are not expanded
      expect(screen.getByText('Apples')).to.have.attr('aria-expanded', 'false');
    });
  });

  describe('tabbableSelector', function () {
    it('should make element that matches selector tabbable when `activeItemId` provided', function () {
      render(<NavigationTree activeItemId="Vegetables"></NavigationTree>);
      expect(screen.getByText('Fruits')).to.have.attr('tabindex', '-1');
      expect(screen.getByText('Vegetables')).to.have.attr('tabindex', '0');
    });
  });
});

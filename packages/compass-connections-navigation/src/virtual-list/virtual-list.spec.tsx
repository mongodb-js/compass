import React, { useCallback, useMemo, useState } from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import type { VirtualItem } from './use-virtual-navigation-tree';
import { VirtualTree } from './virtual-list';

type MockItem = { id: string; items?: MockItem[] };

type MockTreeItem = VirtualItem & { name: string };

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
  expanded: string[] = []
): MockTreeItem[] {
  const data = items
    .map((item, index) => {
      return [
        {
          id: item.id,
          name: item.id,
          level,
          setSize: items.length,
          posInSet: index + 1,
          isExpandable: Array.isArray(item.items),
          ...(item.items && { isExpanded: expanded.includes(item.id) }),
        },
      ].concat(
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        item.items && expanded.includes(item.id)
          ? normalizeItems(item.items, level + 1, expanded)
          : []
      );
    })
    .flat();

  return data.map((item, index) => ({
    ...item,
    posInSet: index + 1,
    setSize: data.length,
  }));
}

function NavigationTree({
  activeItemId,
  defaultExpanded = [],
}: {
  activeItemId?: string;
  defaultExpanded?: string[];
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const onExpandedChange = useCallback(({ id }: { id: string }, isExpanded) => {
    setExpanded((expanded) =>
      isExpanded ? expanded.concat(id) : expanded.filter((_id) => _id !== id)
    );
  }, []);

  const listItems = useMemo(() => {
    return normalizeItems(items, 1, expanded);
  }, [expanded]);

  return (
    <VirtualTree<MockTreeItem>
      activeItemId={activeItemId}
      items={listItems}
      height={400}
      itemHeight={30}
      onDefaultAction={() => {}}
      onItemExpand={onExpandedChange}
      onItemAction={() => {}}
      getItemActions={() => []}
      width={100}
      renderItem={({ item }) => item.name}
      __TEST_OVER_SCAN_COUNT={Infinity}
    />
  );
}

describe('virtual-list', function () {
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
    it('should move focus to the next element on ArrowDown', async function () {
      render(<NavigationTree></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{arrowdown}');
      await waitFor(() => {
        expect(screen.getByText('Vegetables')).to.eq(document.activeElement);
      });
    });

    it('should move focus to the previous element on ArrowUp', async function () {
      render(<NavigationTree activeItemId="Vegetables"></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Vegetables')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{arrowup}');
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
    });

    it('should move focus to the last element on End', async function () {
      render(<NavigationTree></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{end}');
      await waitFor(() => {
        expect(screen.getByText('Vegetables')).to.eq(document.activeElement);
      });
    });

    it('should move focus to the first element on Home', async function () {
      render(<NavigationTree activeItemId="Vegetables"></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Vegetables')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{home}');
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
    });

    it('should move focus to the child treeitem on ArrowRight when expandable treeitem is expanded', async function () {
      render(<NavigationTree defaultExpanded={['Fruits']}></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{arrowright}');
      await waitFor(() => {
        expect(screen.getByText('Oranges')).to.eq(document.activeElement);
      });
    });

    it('should move focus to the parent treeitem on ArrowLeft when expandable treeitem is collapsed', async function () {
      render(
        <NavigationTree
          activeItemId="Bananas"
          defaultExpanded={['Fruits']}
        ></NavigationTree>
      );
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Bananas')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{arrowleft}');
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
    });

    it('should move focus to the next item that starts with the pressed letter', async function () {
      render(
        <NavigationTree
          defaultExpanded={['Vegetables', 'Podded Vegetables']}
        ></NavigationTree>
      );
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
      userEvent.keyboard('{p}');
      await waitFor(() => {
        expect(screen.getByText('Podded Vegetables')).to.eq(
          document.activeElement
        );
      });
      userEvent.keyboard('{p}');
      await waitFor(() => {
        expect(screen.getByText('Pea')).to.eq(document.activeElement);
      });
    });
  });

  describe('keyboard expand / collapse', function () {
    it('should expand collapsed treeitem on ArrowRight and keep the focus on the item', async function () {
      render(<NavigationTree></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'false');
      userEvent.keyboard('{arrowright}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'true');
    });

    it('should collapse expanded treeitem on ArrowLeft and keep the focus on the item', async function () {
      render(<NavigationTree defaultExpanded={['Fruits']}></NavigationTree>);
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      });
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'true');
      userEvent.keyboard('{arrowleft}');
      expect(screen.getByText('Fruits')).to.eq(document.activeElement);
      expect(screen.getByText('Fruits')).to.have.attr('aria-expanded', 'false');
    });

    it('should expand all set siblings of a focused element on * press', async function () {
      render(
        <NavigationTree
          activeItemId="Podded Vegetables"
          defaultExpanded={['Fruits', 'Vegetables']}
        ></NavigationTree>
      );
      userEvent.tab();
      await waitFor(() => {
        expect(screen.getByText('Podded Vegetables')).to.eq(
          document.activeElement
        );
      });
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

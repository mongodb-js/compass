/* eslint-disable @typescript-eslint/ban-types */
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable react/prop-types */
import React, { useCallback, useContext, useState } from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { useTree, useTreeItem } from './use-navigation-tree';
import Sinon from 'sinon';

const ExpandedContext = React.createContext([]);

function useIsExpanded(id) {
  const context = useContext(ExpandedContext);
  return context.includes(id);
}

function NavigationTreeItem({
  id,
  level,
  setSize,
  posInSet,
  onDefaultAction,
  items,
}: {
  id: string;
  level: number;
  setSize: number;
  posInSet: number;
  onDefaultAction: Function;
  items?: any[];
}) {
  const isExpanded = useIsExpanded(id);
  const hasChildren = items && items.length > 0;
  const treeItemProps = useTreeItem({
    level,
    setSize,
    posInSet,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    onDefaultAction,
    ...(hasChildren && { isExpanded }),
  });

  return (
    <li data-id={id} data-testid={id} {...treeItemProps}>
      {id}
      {hasChildren && isExpanded && (
        <ul role="group">
          {items.map(({ id, items: childItems }, index) => (
            <NavigationTreeItem
              key={id}
              id={id}
              level={level + 1}
              setSize={items.length}
              posInSet={index + 1}
              onDefaultAction={onDefaultAction}
              items={childItems}
            ></NavigationTreeItem>
          ))}
        </ul>
      )}
    </li>
  );
}

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

function NavigationTree({
  tabbableItem,
  defaultExpanded = [],
  onDefaultAction = () => {},
}: {
  tabbableItem?: string;
  defaultExpanded?: string[];
  onDefaultAction?: Function;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const onExpandedChange = useCallback((id, isExpanded) => {
    setExpanded((expanded) =>
      isExpanded ? expanded.concat(id) : expanded.filter((_id) => _id !== id)
    );
  }, []);
  const treeProps = useTree({
    ...(tabbableItem && { tabbableSelector: `[data-id="${tabbableItem}"]` }),
    onExpandedChange,
  });
  return (
    <ExpandedContext.Provider value={expanded}>
      <ul {...treeProps}>
        {items.map(({ id, items: childItems }, index) => (
          <NavigationTreeItem
            key={id}
            id={id}
            level={1}
            setSize={items.length}
            posInSet={index + 1}
            onDefaultAction={onDefaultAction}
            items={childItems}
          ></NavigationTreeItem>
        ))}
      </ul>
    </ExpandedContext.Provider>
  );
}

describe('useTree / useTreeItem', function () {
  afterEach(cleanup);

  it('should render root tree', function () {
    render(<NavigationTree></NavigationTree>);
    expect(screen.getByRole('tree')).to.exist;
  });

  it('should render tree items with required attributes', function () {
    render(<NavigationTree></NavigationTree>);
    const fruits = screen.getByText('Fruits');
    expect(fruits).to.exist;
    expect(fruits).to.have.attr('role', 'treeitem');
    expect(fruits).to.have.attr('aria-level', '1');
    expect(fruits).to.have.attr('aria-setsize', '2');
    expect(fruits).to.have.attr('aria-posinset', '1');
    expect(fruits).to.have.attr('aria-expanded', 'false');
  });

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
      render(<NavigationTree tabbableItem="Vegetables"></NavigationTree>);
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
      render(<NavigationTree tabbableItem="Vegetables"></NavigationTree>);
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
          tabbableItem="Bananas"
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
          tabbableItem="Podded Vegetables"
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
    it('should make element that matches selector tabbable when `tabbableSelector` provided', function () {
      render(<NavigationTree tabbableItem="Vegetables"></NavigationTree>);
      expect(screen.getByText('Fruits')).to.have.attr('tabindex', '-1');
      expect(screen.getByText('Vegetables')).to.have.attr('tabindex', '0');
    });
  });

  describe('onDefaultAction', function () {
    it('should trigger the callback when Enter is pressed on the focused treeitem', function () {
      const onDefaultAction = Sinon.spy();
      render(
        <NavigationTree onDefaultAction={onDefaultAction}></NavigationTree>
      );
      userEvent.tab();
      userEvent.keyboard('{enter}');
      expect(onDefaultAction).to.be.calledOnce;
    });

    it('should trigger the callback when Space is pressed on the focused treeitem', function () {
      const onDefaultAction = Sinon.spy();
      render(
        <NavigationTree onDefaultAction={onDefaultAction}></NavigationTree>
      );
      userEvent.tab();
      userEvent.keyboard('{space}');
      expect(onDefaultAction).to.be.calledOnce;
    });
  });
});

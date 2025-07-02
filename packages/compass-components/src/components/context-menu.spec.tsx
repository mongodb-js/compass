import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ContextMenuProvider } from '@mongodb-js/compass-context-menu';
import { useContextMenuItems, ContextMenu } from './context-menu';
import type { ContextMenuItem } from '@mongodb-js/compass-context-menu';

describe('useContextMenuItems', function () {
  const menuTestTriggerId = 'test-trigger';

  const TestComponent = ({
    items,
    children,
    'data-testid': dataTestId = menuTestTriggerId,
  }: {
    items: ContextMenuItem[];
    children?: React.ReactNode;
    'data-testid'?: string;
  }) => {
    const ref = useContextMenuItems(() => items, [items]);

    return (
      <div data-testid={dataTestId} ref={ref}>
        Test Component
        {children}
      </div>
    );
  };

  it('works with nested providers, using the parent provider', function () {
    const items = [
      {
        label: 'Test Item',
        onAction: () => {},
      },
    ];

    const { container } = render(
      <ContextMenuProvider menuWrapper={ContextMenu}>
        <ContextMenuProvider menuWrapper={ContextMenu}>
          <TestComponent items={items} />
        </ContextMenuProvider>
      </ContextMenuProvider>
    );

    // Should only find one context menu (from the parent provider)
    expect(
      container.querySelectorAll('[data-testid="context-menu-container"]')
    ).to.have.length(1);
    // Should still render the trigger
    expect(screen.getByTestId(menuTestTriggerId)).to.exist;
  });

  it('renders without error', function () {
    const items = [
      {
        label: 'Test Item',
        onAction: () => {},
      },
    ];

    render(<TestComponent items={items} />);

    expect(screen.getByTestId(menuTestTriggerId)).to.exist;
  });

  it('shows context menu with items on right click', function () {
    const items = [
      {
        label: 'Test Item 1',
        onAction: () => {},
      },
      {
        label: 'Test Item 2',
        onAction: () => {},
      },
    ];

    render(<TestComponent items={items} />);

    const trigger = screen.getByTestId(menuTestTriggerId);
    userEvent.click(trigger, { button: 2 });

    // The menu items should be rendered
    expect(screen.getByTestId('menu-group-0-item-0')).to.exist;
    expect(screen.getByTestId('menu-group-0-item-1')).to.exist;
  });

  it('triggers the correct action when menu item is clicked', function () {
    const onAction = sinon.spy();
    const items = [
      {
        label: 'Test Item 1',
        onAction: () => onAction(1),
      },
      {
        label: 'Test Item 2',
        onAction: () => onAction(2),
      },
    ];

    render(<TestComponent items={items} />);

    const trigger = screen.getByTestId(menuTestTriggerId);
    userEvent.click(trigger, { button: 2 });

    const menuItem = screen.getByTestId('menu-group-0-item-1');
    userEvent.click(menuItem);

    expect(onAction).to.have.been.calledOnceWithExactly(2);
  });

  describe('with nested components', function () {
    const childTriggerId = 'child-trigger';

    beforeEach(function () {
      const items = [
        {
          label: 'Test Item 1',
          onAction: () => {},
        },
        {
          label: 'Test Item 2',
          onAction: () => {},
        },
      ];

      const childItems = [
        {
          label: 'Child Item 1',
          onAction: () => {},
        },
      ];

      render(
        <TestComponent items={items}>
          <TestComponent items={childItems} data-testid={childTriggerId} />
        </TestComponent>
      );
    });

    it('renders menu items with separators', function () {
      const trigger = screen.getByTestId(childTriggerId);
      userEvent.click(trigger, { button: 2 });

      // Should find the menu item and the separator
      expect(screen.getByTestId('menu-group-0').children.length).to.equal(2);
      expect(
        screen.getByTestId('menu-group-0').children.item(0)?.textContent
      ).to.equal('Child Item 1');

      expect(screen.getByTestId('menu-group-0-separator')).to.exist;

      expect(screen.getByTestId('menu-group-1').children.length).to.equal(2);
      expect(
        screen.getByTestId('menu-group-1').children.item(0)?.textContent
      ).to.equal('Test Item 1');
      expect(
        screen.getByTestId('menu-group-1').children.item(1)?.textContent
      ).to.equal('Test Item 2');

      expect(screen.queryByTestId('menu-group-1-separator')).not.to.exist;
    });
  });
});

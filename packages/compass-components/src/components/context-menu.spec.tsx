import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ContextMenuProvider } from '@mongodb-js/compass-context-menu';
import { useContextMenuItems, ContextMenu } from './context-menu';
import type { ContextMenuItem } from '@mongodb-js/compass-context-menu';

describe('useContextMenuItems', function () {
  let items: ContextMenuItem[];
  let onAction: sinon.SinonSpy;

  function assertMenuItemsExist(items: ContextMenuItem[]) {
    for (let i = 0; i < items.length; i++) {
      expect(screen.getByTestId(`menu-group-0-item-${i}`)).to.exist;
    }
  }

  function assertMenuItemsDoNotExist(items: ContextMenuItem[]) {
    for (let i = 0; i < items.length; i++) {
      expect(screen.queryByTestId(`menu-group-0-item-${i}`)).not.to.exist;
    }
  }

  beforeEach(function () {
    onAction = sinon.spy();
    items = [
      {
        label: 'Test Item 1',
        onAction: () => onAction(1),
      },
      {
        label: 'Test Item 2',
        onAction: () => onAction(2),
      },
    ];
  });

  afterEach(function () {
    sinon.restore();
  });

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
    const { container } = render(
      <ContextMenuProvider menuWrapper={ContextMenu}>
        <ContextMenuProvider menuWrapper={ContextMenu}>
          <TestComponent items={items} />
        </ContextMenuProvider>
      </ContextMenuProvider>
    );

    // Should only find one context menu (from the parent provider)
    expect(
      container.querySelectorAll('[data-testid="context-menu"]')
    ).to.have.length(1);
    // Should still render the trigger
    expect(screen.getByTestId(menuTestTriggerId)).to.exist;
  });

  it('renders without error', function () {
    render(<TestComponent items={items} />);

    expect(screen.getByTestId(menuTestTriggerId)).to.exist;
  });

  it('shows context menu with items on right click', function () {
    render(<TestComponent items={items} />);

    const trigger = screen.getByTestId(menuTestTriggerId);
    userEvent.click(trigger, { button: 2 });

    // The menu items should be rendered
    assertMenuItemsExist(items);
  });

  it('triggers the correct action when menu item is clicked', function () {
    render(<TestComponent items={items} />);

    const trigger = screen.getByTestId(menuTestTriggerId);
    userEvent.click(trigger, { button: 2 });

    const menuItem = screen.getByTestId('menu-group-0-item-1');
    userEvent.click(menuItem);

    expect(onAction).to.have.been.calledOnceWithExactly(2);
  });

  it('closes the menu when an item is clicked', async function () {
    render(<TestComponent items={items} />);

    const trigger = screen.getByTestId(menuTestTriggerId);

    // Open the menu with right-click
    userEvent.click(trigger, { button: 2 });

    // Verify the menu is open (items exist)
    assertMenuItemsExist(items);

    // Click on a menu item
    const menuItem = screen.getByTestId('menu-group-0-item-0');
    userEvent.click(menuItem);

    // Verify the menu is closed (items do not exist)
    await waitFor(() => assertMenuItemsDoNotExist(items));
  });

  it('closes the menu when clicking outside the menu', async function () {
    render(<TestComponent items={items} />);

    const trigger = screen.getByTestId(menuTestTriggerId);

    // Open the menu with right-click
    userEvent.click(trigger, { button: 2 });

    // Verify the menu is open (items exist)
    assertMenuItemsExist(items);

    // Click outside the menu (on document body)
    userEvent.click(document.body);

    // Verify the menu is closed (items do not exist)
    await waitFor(() => assertMenuItemsDoNotExist(items));
  });

  describe('with nested components', function () {
    const childTriggerId = 'child-trigger';

    beforeEach(function () {
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

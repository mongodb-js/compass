import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { ContextMenuProvider } from '@mongodb-js/compass-context-menu';
import { useContextMenuItems, ContextMenu } from './context-menu';
import type { ContextMenuItem } from '@mongodb-js/compass-context-menu';

describe('useContextMenuItems', function () {
  const TestComponent = ({ items }: { items: ContextMenuItem[] }) => {
    const ref = useContextMenuItems(items);

    return (
      <div data-testid="test-trigger" ref={ref}>
        Test Component
      </div>
    );
  };

  describe('when used outside provider', function () {
    it('throws an error', function () {
      const items = [
        {
          label: 'Test Item',
          onAction: () => {},
        },
      ];

      expect(() => {
        render(<TestComponent items={items} />);
      }).to.throw('useContextMenu called outside of the provider');
    });
  });

  describe('with a valid provider', function () {
    beforeEach(() => {
      // Create the container for the context menu portal
      const container = document.createElement('div');
      container.id = 'context-menu-container';
      document.body.appendChild(container);
    });

    afterEach(() => {
      // Clean up the container
      const container = document.getElementById('context-menu-container');
      if (container) {
        document.body.removeChild(container);
      }
    });

    it('renders without error', function () {
      const items = [
        {
          label: 'Test Item',
          onAction: () => {},
        },
      ];

      render(
        <ContextMenuProvider wrapper={ContextMenu}>
          <TestComponent items={items} />
        </ContextMenuProvider>
      );

      expect(screen.getByTestId('test-trigger')).to.exist;
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

      render(
        <ContextMenuProvider wrapper={ContextMenu}>
          <TestComponent items={items} />
        </ContextMenuProvider>
      );

      const trigger = screen.getByTestId('test-trigger');
      userEvent.click(trigger, { button: 2 });

      // The menu items should be rendered
      expect(screen.getByTestId('context-menu-item-Test Item 1')).to.exist;
      expect(screen.getByTestId('context-menu-item-Test Item 2')).to.exist;
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

      render(
        <ContextMenuProvider wrapper={ContextMenu}>
          <TestComponent items={items} />
        </ContextMenuProvider>
      );

      const trigger = screen.getByTestId('test-trigger');
      userEvent.click(trigger, { button: 2 });

      const menuItem = screen.getByTestId('context-menu-item-Test Item 2');
      userEvent.click(menuItem);

      expect(onAction).to.have.been.calledOnceWithExactly(2);
    });

    it('renders menu items with separators', function () {
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

      render(
        <ContextMenuProvider wrapper={ContextMenu}>
          <TestComponent items={items} />
        </ContextMenuProvider>
      );

      const trigger = screen.getByTestId('test-trigger');
      userEvent.click(trigger, { button: 2 });

      // Should find both menu items and a separator between them
      expect(screen.getByTestId('context-menu-item-Test Item 1')).to.exist;
      expect(screen.getByRole('separator')).to.exist;
      expect(screen.getByTestId('context-menu-item-Test Item 2')).to.exist;
    });
  });
});

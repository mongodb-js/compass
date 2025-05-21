import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { useContextMenu } from './use-context-menu';
import { ContextMenuProvider } from './context-menu-provider';
import type { MenuItem } from './types';

type TestMenuItem = MenuItem & { id: number };

describe('useContextMenu', function () {
  const TestMenu: React.FC<{ items: TestMenuItem[] }> = ({ items }) => (
    <div data-testid="test-menu">
      {items.map((item, idx) => (
        <div key={idx} data-testid={`menu-item-${item.id}`}>
          {item.label}
        </div>
      ))}
    </div>
  );

  const TestComponent = () => {
    const contextMenu = useContextMenu({ Menu: TestMenu });
    const items: TestMenuItem[] = [
      {
        id: 1,
        label: 'Test A',
        onAction: () => {
          /* noop */
        },
      },
      {
        id: 2,
        label: 'Test B',
        onAction: () => {
          /* noop */
        },
      },
    ];
    const ref = contextMenu.registerItems(items);

    return (
      <div data-testid="test-trigger" ref={ref}>
        Test Component
      </div>
    );
  };

  describe('when used outside provider', function () {
    it('throws an error', function () {
      expect(() => {
        render(<TestComponent />);
      }).to.throw('useContextMenu called outside of the provider');
    });
  });

  describe('with valid provider', function () {
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
      render(
        <ContextMenuProvider>
          <TestComponent />
        </ContextMenuProvider>
      );

      expect(screen.getByTestId('test-trigger')).to.exist;
    });

    it('shows context menu on right click', function () {
      render(
        <ContextMenuProvider>
          <TestComponent />
        </ContextMenuProvider>
      );

      expect(screen.queryByTestId('menu-item-1')).not.to.exist;
      expect(screen.queryByTestId('menu-item-2')).not.to.exist;

      const trigger = screen.getByTestId('test-trigger');
      userEvent.click(trigger, { button: 2 });

      // The menu should be rendered in the portal
      expect(screen.getByTestId('menu-item-1')).to.exist;
      expect(screen.getByTestId('menu-item-2')).to.exist;
    });

    it('cleans up previous event listener when ref changes', function () {
      const removeEventListenerSpy = sinon.spy();
      const addEventListenerSpy = sinon.spy();

      const { rerender } = render(
        <ContextMenuProvider>
          <TestComponent />
        </ContextMenuProvider>
      );

      // Simulate ref change
      const ref = screen.getByTestId('test-trigger');
      Object.defineProperty(ref, 'addEventListener', {
        value: addEventListenerSpy,
      });
      Object.defineProperty(ref, 'removeEventListener', {
        value: removeEventListenerSpy,
      });

      rerender(
        <ContextMenuProvider>
          <TestComponent />
        </ContextMenuProvider>
      );

      expect(removeEventListenerSpy).to.have.been.calledWith('contextmenu');
      expect(addEventListenerSpy).to.have.been.calledWith('contextmenu');
    });
  });
});

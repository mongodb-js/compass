import React from 'react';
import {
  render,
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { useContextMenu } from './use-context-menu';
import { ContextMenuProvider } from './context-menu-provider';
import type { MenuItem } from './types';

describe('useContextMenu', function () {
  const TestMenu: React.FC<{ items: MenuItem[] }> = ({ items }) => (
    <div data-testid="test-menu">
      {items.map((item, idx) => (
        <div key={idx} data-testid={`menu-item-${item.label}`}>
          {item.label}
        </div>
      ))}
    </div>
  );

  const TestComponent = ({
    onRegister,
  }: {
    onRegister?: (ref: any) => void;
  }) => {
    const contextMenu = useContextMenu({ Menu: TestMenu });
    const items: MenuItem[] = [
      {
        label: 'Test Item',
        onAction: () => {
          /* noop */
        },
      },
    ];
    const ref = contextMenu.registerItems(items);

    React.useEffect(() => {
      onRegister?.(ref);
    }, [ref, onRegister]);

    return (
      <div data-testid="test-trigger" ref={ref}>
        Test Component
      </div>
    );
  };

  afterEach(cleanup);

  describe('when used outside provider', function () {
    it('throws an error', function () {
      expect(() => {
        render(<TestComponent />);
      }).to.throw('useContextMenu called outside of the provider');
    });
  });

  describe('when used inside provider', function () {
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

    it('registers context menu event listener', function () {
      const onRegister = sinon.spy();

      render(
        <ContextMenuProvider>
          <TestComponent onRegister={onRegister} />
        </ContextMenuProvider>
      );

      expect(onRegister).to.have.been.calledOnce;
      expect(onRegister.firstCall.args[0]).to.be.a('function');
    });

    it('shows context menu on right click', function () {
      render(
        <ContextMenuProvider>
          <TestComponent />
        </ContextMenuProvider>
      );

      const trigger = screen.getByTestId('test-trigger');
      userEvent.click(trigger, { button: 2 });

      // The menu should be rendered in the portal
      expect(screen.getByTestId('menu-item-Test Item')).to.exist;
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

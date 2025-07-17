import React from 'react';
import {
  screen,
  userEvent,
  testingLibrary,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { useContextMenu } from './use-context-menu';
import { ContextMenuProvider } from './context-menu-provider';
import type { ContextMenuItem, ContextMenuWrapperProps } from './types';

// We need to import from testing-library-compass directly to avoid the extra wrapping.
const { render } = testingLibrary;

describe('useContextMenu', function () {
  const TestMenu: React.FC<ContextMenuWrapperProps> = ({ menu }) => (
    <div data-testid="test-menu">
      {menu.itemGroups.flatMap((items, groupIdx) =>
        items.map((item, idx) => (
          <div
            key={`${groupIdx}-${idx}`}
            data-testid={`menu-item-${item.label}`}
            role="menuitem"
            tabIndex={0}
            onClick={(event) => item.onAction?.(event)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                item.onAction?.(event);
              }
            }}
          >
            {item.label}
          </div>
        ))
      )}
    </div>
  );

  const TestComponent = ({
    onRegister,
    onAction,
  }: {
    onRegister?: (ref: unknown) => void;
    onAction?: (id: number) => void;
  }) => {
    const contextMenu = useContextMenu();
    const items: ContextMenuItem[] = [
      {
        label: 'Test Item',
        onAction: () => onAction?.(1),
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

  const ParentComponent = ({
    onAction,
    children,
  }: {
    onAction?: (id: number) => void;
    children?: React.ReactNode;
  }) => {
    const contextMenu = useContextMenu();
    const parentItems: ContextMenuItem[] = [
      {
        label: 'Parent Item 1',
        onAction: () => onAction?.(1),
      },
      {
        label: 'Parent Item 2',
        onAction: () => onAction?.(2),
      },
    ];
    const ref = contextMenu.registerItems(parentItems);

    return (
      <div data-testid="parent-trigger" ref={ref}>
        <div>Parent Component</div>
        {children}
      </div>
    );
  };

  const ChildComponent = ({
    onAction,
  }: {
    onAction?: (id: number) => void;
  }) => {
    const contextMenu = useContextMenu();
    const childItems: ContextMenuItem[] = [
      {
        label: 'Child Item 1',
        onAction: () => onAction?.(1),
      },
      {
        label: 'Child Item 2',
        onAction: () => onAction?.(2),
      },
    ];
    const ref = contextMenu.registerItems(childItems);

    return (
      <div data-testid="child-trigger" ref={ref}>
        Child Component
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
      render(
        <ContextMenuProvider menuWrapper={TestMenu}>
          <TestComponent />
        </ContextMenuProvider>
      );

      expect(screen.getByTestId('test-trigger')).to.exist;
    });

    it('registers context menu event listener', function () {
      const onRegister = sinon.spy();

      render(
        <ContextMenuProvider menuWrapper={TestMenu}>
          <TestComponent onRegister={onRegister} />
        </ContextMenuProvider>
      );

      expect(onRegister).to.have.been.calledOnce;
      expect(onRegister.firstCall.args[0]).to.be.a('function');
    });

    it('shows context menu on right click', function () {
      render(
        <ContextMenuProvider menuWrapper={TestMenu}>
          <TestComponent />
        </ContextMenuProvider>
      );

      const trigger = screen.getByTestId('test-trigger');
      userEvent.click(trigger, { button: 2 });

      // The menu should be rendered in the portal
      expect(screen.getByTestId('menu-item-Test Item')).to.exist;
    });

    describe('with nested context menus', function () {
      it('shows only parent items when right clicking parent area', function () {
        render(
          <ContextMenuProvider menuWrapper={TestMenu}>
            <ParentComponent />
          </ContextMenuProvider>
        );

        const parentTrigger = screen.getByTestId('parent-trigger');
        userEvent.click(parentTrigger, { button: 2 });

        // Should show parent items
        expect(screen.getByTestId('menu-item-Parent Item 1')).to.exist;
        expect(screen.getByTestId('menu-item-Parent Item 2')).to.exist;

        // Should not show child items
        expect(() => screen.getByTestId('menu-item-Child Item 1')).to.throw;
        expect(() => screen.getByTestId('menu-item-Child Item 2')).to.throw;
      });

      it('shows both parent and child items when right clicking child area', function () {
        render(
          <ContextMenuProvider menuWrapper={TestMenu}>
            <ParentComponent>
              <ChildComponent />
            </ParentComponent>
          </ContextMenuProvider>
        );

        const childTrigger = screen.getByTestId('child-trigger');
        userEvent.click(childTrigger, { button: 2 });

        // Should show both parent and child items
        expect(screen.getByTestId('menu-item-Parent Item 1')).to.exist;
        expect(screen.getByTestId('menu-item-Parent Item 2')).to.exist;
        expect(screen.getByTestId('menu-item-Child Item 1')).to.exist;
        expect(screen.getByTestId('menu-item-Child Item 2')).to.exist;
      });

      it('triggers only the child action when clicking child menu item', function () {
        const parentOnAction = sinon.spy();
        const childOnAction = sinon.spy();

        render(
          <ContextMenuProvider menuWrapper={TestMenu}>
            <ParentComponent onAction={parentOnAction}>
              <ChildComponent onAction={childOnAction} />
            </ParentComponent>
          </ContextMenuProvider>
        );

        const childTrigger = screen.getByTestId('child-trigger');
        userEvent.click(childTrigger, { button: 2 });

        const childItem1 = screen.getByTestId('menu-item-Child Item 1');
        userEvent.click(childItem1);

        expect(childOnAction).to.have.been.calledOnceWithExactly(1);
        expect(parentOnAction).to.not.have.been.called;
        expect(() => screen.getByTestId('test-menu')).to.throw;
      });

      it('triggers only the parent action when clicking a parent menu item from child context', function () {
        const parentOnAction = sinon.spy();
        const childOnAction = sinon.spy();

        render(
          <ContextMenuProvider menuWrapper={TestMenu}>
            <ParentComponent onAction={parentOnAction}>
              <ChildComponent onAction={childOnAction} />
            </ParentComponent>
          </ContextMenuProvider>
        );

        const childTrigger = screen.getByTestId('child-trigger');
        userEvent.click(childTrigger, { button: 2 });

        const parentItem1 = screen.getByTestId('menu-item-Parent Item 1');
        userEvent.click(parentItem1);

        expect(parentOnAction).to.have.been.calledOnceWithExactly(1);
        expect(childOnAction).to.not.have.been.called;
        expect(() => screen.getByTestId('test-menu')).to.throw;
      });
    });

    describe('menu closing behavior', function () {
      for (const event of ['scroll', 'resize', 'click']) {
        it(`closes menu on window ${event} event`, function () {
          render(
            <ContextMenuProvider menuWrapper={TestMenu}>
              <TestComponent />
            </ContextMenuProvider>
          );

          const trigger = screen.getByTestId('test-trigger');
          userEvent.click(trigger, { button: 2 });

          // Verify menu is open
          expect(screen.getByTestId('menu-item-Test Item')).to.exist;

          window.dispatchEvent(new Event(event));

          // Verify menu is closed
          expect(() => screen.getByTestId('test-menu')).to.throw;
        });
      }
    });
  });
});

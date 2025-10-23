import React from 'react';
import { render, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  ApplicationMenuContextProvider,
  useApplicationMenu,
} from './application-menu';
import type { CompassAppMenu } from './types';

describe('application-menu / useApplicationMenu', function () {
  afterEach(() => {
    cleanup();
    sinon.restore();
  });

  function createMockProvider() {
    const showUnsubscribes: sinon.SinonSpy[] = [];
    const roleUnsubscribes: sinon.SinonSpy[] = [];
    const showApplicationMenu = sinon.stub().callsFake(() => {
      const unsub = sinon.spy();
      showUnsubscribes.push(unsub);
      return unsub;
    });
    const handleMenuRole = sinon.stub().callsFake(() => {
      const unsub = sinon.spy();
      roleUnsubscribes.push(unsub);
      return unsub;
    });
    return {
      provider: { showApplicationMenu, handleMenuRole },
      showUnsubscribes,
      roleUnsubscribes,
    };
  }

  const TestComponent: React.FC<{
    menu?: CompassAppMenu;
    roles?: Record<string, () => void>;
  }> = ({ menu, roles }) => {
    useApplicationMenu({ menu, roles });
    return null;
  };

  it('subscribes to menu and roles and unsubscribes on unmount', function () {
    const { provider, showUnsubscribes, roleUnsubscribes } =
      createMockProvider();
    const menu: CompassAppMenu = {
      label: '&File',
      submenu: [{ label: 'Item', click: () => {} }],
    };
    const roles = {
      undo: () => {},
      redo: () => {},
    };

    const { unmount } = render(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent menu={menu} roles={roles} />
      </ApplicationMenuContextProvider>
    );

    expect(provider.showApplicationMenu.calledOnce).to.equal(true);
    expect(provider.handleMenuRole.callCount).to.equal(2);
    expect(showUnsubscribes).to.have.length(1);
    expect(roleUnsubscribes).to.have.length(2);
    for (const u of showUnsubscribes) expect(u.called).to.equal(false);
    for (const u of roleUnsubscribes) expect(u.called).to.equal(false);

    unmount();

    for (const u of showUnsubscribes) expect(u.calledOnce).to.equal(true);
    for (const u of roleUnsubscribes) expect(u.calledOnce).to.equal(true);
  });

  it('does not subscribe when neither menu nor roles provided', function () {
    const { provider } = createMockProvider();
    const { unmount } = render(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent />
      </ApplicationMenuContextProvider>
    );
    expect(provider.showApplicationMenu.called).to.equal(false);
    expect(provider.handleMenuRole.called).to.equal(false);
    unmount();
    // No unsubscribes expected
    expect(provider.showApplicationMenu.called).to.equal(false);
  });

  it('re-subscribes when a menu handler identity changes', function () {
    const { provider, showUnsubscribes } = createMockProvider();

    const clickA = () => {};
    const menuA: CompassAppMenu = {
      label: '&Edit',
      submenu: [{ label: 'Action', click: clickA }],
    };

    const { rerender } = render(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent menu={menuA} />
      </ApplicationMenuContextProvider>
    );

    expect(provider.showApplicationMenu.callCount).to.equal(1);
    expect(showUnsubscribes[0].called).to.equal(false);

    // Rerender with same function identity: should NOT resubscribe
    rerender(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent menu={menuA} />
      </ApplicationMenuContextProvider>
    );
    expect(provider.showApplicationMenu.callCount).to.equal(1);

    // Change click handler identity: should resubscribe
    const menuB: CompassAppMenu = {
      ...menuA,
      submenu: [{ label: 'Action', click: () => {} }],
    };
    rerender(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent menu={menuB} />
      </ApplicationMenuContextProvider>
    );

    expect(provider.showApplicationMenu.callCount).to.equal(2);
    // First unsubscribe should have been called during effect cleanup
    expect(showUnsubscribes[0].calledOnce).to.equal(true);
    expect(showUnsubscribes[1].called).to.equal(false);
  });

  it('re-subscribes to roles when role handler identities change', function () {
    const { provider, roleUnsubscribes } = createMockProvider();

    const handlerUndoA = () => {};
    const handlerRedoA = () => {};
    let roles: Record<string, () => void> = {
      undo: handlerUndoA,
      redo: handlerRedoA,
    };

    const { rerender } = render(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent roles={roles} />
      </ApplicationMenuContextProvider>
    );

    expect(provider.handleMenuRole.callCount).to.equal(2);
    expect(roleUnsubscribes[0].called).to.equal(false);
    expect(roleUnsubscribes[1].called).to.equal(false);

    // Rerender with same handler identities: no resubscribe
    rerender(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent roles={roles} />
      </ApplicationMenuContextProvider>
    );
    expect(provider.handleMenuRole.callCount).to.equal(2);

    // Change one handler identity
    roles = {
      undo: () => {}, // new identity
      redo: handlerRedoA, // same identity
    };
    rerender(
      <ApplicationMenuContextProvider provider={provider}>
        <TestComponent roles={roles} />
      </ApplicationMenuContextProvider>
    );
    // Both roles re-subscribed because dependency array uses all handlers serialized
    expect(provider.handleMenuRole.callCount).to.equal(4);
    // First two unsubscribes called
    expect(roleUnsubscribes[0].calledOnce).to.equal(true);
    expect(roleUnsubscribes[1].calledOnce).to.equal(true);
    // New unsubscribes not yet called
    expect(roleUnsubscribes[2].called).to.equal(false);
    expect(roleUnsubscribes[3].called).to.equal(false);
  });
});

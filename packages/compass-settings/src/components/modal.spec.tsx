import React, { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { SinonSpy, spy } from 'sinon';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import store from '../stores';
import { SettingsModal } from './modal';

const setupIpc = () => {
  if (require('hadron-ipc').on) {
    return;
  }

  const callbacks = {};
  require('hadron-ipc').on = (name: string, callback: CallableFunction) => {
    if (!callbacks[name]) {
      callbacks[name] = [];
    }
    callbacks[name].push(callback);
  };
  require('hadron-ipc').emit = (name: string, ...args: unknown[]) => {
    (callbacks[name] ?? []).forEach((callback: CallableFunction) =>
      callback(...args)
    );
  };
};

const renderSettingsModal = (
  props: Partial<ComponentProps<typeof SettingsModal>> = {}
) => {
  render(
    <Provider store={store}>
      <SettingsModal onInit={() => {}} {...props} />
    </Provider>
  );
};

describe('SettingsModal', function () {
  let onInitSpy: SinonSpy<any[], any>;
  beforeEach(() => {
    setupIpc();
    onInitSpy = spy();
    renderSettingsModal({ onInit: onInitSpy });
    require('hadron-ipc').emit('window:show-network-optin');
  });

  it('sets up component', function () {
    expect(onInitSpy.calledOnce).to.be.true;
    const container = screen.getByTestId('settings-modal');
    expect(container).to.exist;
    expect(within(container).getByTestId('settings-modal-title')).to.exist;
  });

  it('navigates between settings', function () {
    const container = screen.getByTestId('settings-modal');
    const sidebar = within(container).getByTestId('settings-modal-sidebar');
    expect(sidebar).to.exist;

    ['Privacy'].forEach((option) => {
      const button = within(sidebar).getByTestId(`sidebar-${option}-item`);
      expect(button, `it renders ${option} button`).to.exist;
      userEvent.click(button);
      const tab = screen.getByTestId('settings-modal-content');
      expect(
        tab.getAttribute('aria-labelledby'),
        `it renders ${option} tab`
      ).to.equal(`${option} Tab`);
    });
  });
});

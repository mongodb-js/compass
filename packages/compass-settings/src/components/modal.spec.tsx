import React from 'react';
import type { ComponentProps } from 'react';
import {
  render,
  screen,
  within,
  waitFor,
  cleanup,
} from '@testing-library/react';
import { spy, stub } from 'sinon';
import type { SinonSpy } from 'sinon';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { configureStore } from '../stores';
import { SettingsModal } from './modal';

describe('SettingsModal', function () {
  let onCloseSpy: SinonSpy;
  let fetchSettingsSpy: SinonSpy;
  let onSaveSpy: SinonSpy;
  let renderSettingsModal: (
    props?: Partial<ComponentProps<typeof SettingsModal>>
  ) => void;

  beforeEach(function () {
    onCloseSpy = spy();
    fetchSettingsSpy = stub().resolves();
    onSaveSpy = spy();

    const store = configureStore({ logger: stub() as any });
    renderSettingsModal = (
      props: Partial<ComponentProps<typeof SettingsModal>> = {}
    ) => {
      render(
        <Provider store={store}>
          <SettingsModal
            isOpen={false}
            onClose={onCloseSpy}
            fetchSettings={fetchSettingsSpy}
            onSave={onSaveSpy}
            loadingState="ready"
            hasChangedSettings={false}
            {...props}
          />
        </Provider>
      );
    };
  });

  afterEach(function () {
    cleanup();
  });

  it('renders nothing until it is open and loaded', function () {
    renderSettingsModal({ isOpen: false });

    expect(fetchSettingsSpy.called).to.be.false;
    const container = screen.queryByTestId('settings-modal');
    expect(container).to.not.exist;
  });

  it('modal footer actions', async function () {
    renderSettingsModal({ isOpen: true, hasChangedSettings: true });
    expect(onSaveSpy.callCount).to.equal(0);

    await waitFor(() => {
      const container = screen.getByTestId('settings-modal');
      const saveButton = within(container).getByTestId('submit-button');
      expect(saveButton).to.exist;

      userEvent.click(saveButton);
      expect(onSaveSpy.calledOnce).to.be.true;
    });
  });

  it('navigates between settings', async function () {
    renderSettingsModal({ isOpen: true });

    let sidebar;
    await waitFor(() => {
      const container = screen.getByTestId('settings-modal');
      sidebar = within(container).getByTestId('settings-modal-sidebar');
      expect(sidebar).to.exist;
    });

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

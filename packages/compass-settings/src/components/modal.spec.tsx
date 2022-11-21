import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within, waitFor } from '@testing-library/react';
import { spy, stub } from 'sinon';
import type { SinonSpy } from 'sinon';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import store from '../stores';
import { SettingsModal } from './modal';

describe('SettingsModal', function () {
  let closeModalSpy: SinonSpy;
  let fetchSettingsSpy: SinonSpy;
  let onSaveSpy: SinonSpy;
  let renderSettingsModal: (
    props?: Partial<ComponentProps<typeof SettingsModal>>
  ) => void;

  beforeEach(function () {
    closeModalSpy = spy();
    fetchSettingsSpy = stub().resolves();
    onSaveSpy = spy();

    renderSettingsModal = (
      props: Partial<ComponentProps<typeof SettingsModal>> = {}
    ) => {
      render(
        <Provider store={store}>
          <SettingsModal
            isOpen={false}
            closeModal={closeModalSpy}
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

  it('renders nothing until it is open and loaded', function () {
    renderSettingsModal({ loadingState: 'loading' });

    expect(fetchSettingsSpy.called).to.be.false;
    const container = screen.queryByTestId('settings-modal');
    expect(container).to.not.exist;
  });

  it('renders eventually once open and loaded', async function () {
    renderSettingsModal({ isOpen: true });

    expect(fetchSettingsSpy.calledOnce).to.be.true;
    await waitFor(() => {
      const container = screen.getByTestId('settings-modal');
      expect(container).to.exist;
      expect(within(container).getByTestId('modal-title')).to.exist;
    });
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

import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import Sidebar from './sidebar';

describe('Sidebar', function () {
  afterEach(function () {
    cleanup();
  });

  it('renders sidebar with menu items', function () {
    render(
      <Sidebar
        activeItem="theme"
        items={['theme', 'profile']}
        onSelectItem={() => {}}
      />
    );
    const sidebar = screen.getByTestId('settings-modal-sidebar');
    expect(sidebar).to.exist;
    expect(within(sidebar).getByTestId('sidebar-theme-item')).to.exist;
    expect(within(sidebar).getByTestId('sidebar-profile-item')).to.exist;
  });

  it('selects an items', function () {
    const onSelectItemSpy = spy();
    render(
      <Sidebar
        activeItem="theme"
        items={['theme', 'profile']}
        onSelectItem={onSelectItemSpy}
      />
    );
    expect(onSelectItemSpy.calledOnce).to.be.false;
    const sidebar = screen.getByTestId('settings-modal-sidebar');

    const profileItem = within(sidebar).getByTestId('sidebar-profile-item');
    userEvent.click(profileItem);
    expect(onSelectItemSpy.calledOnce).to.be.true;
  });
});

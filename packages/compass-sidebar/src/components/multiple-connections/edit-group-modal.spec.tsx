import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import EditGroupModal from './edit-group-modal';

describe('EditGroupModal', function () {
  afterEach(function () {
    sinon.restore();
  });

  it('is not rendered when isOpen is false', function () {
    render(
      <EditGroupModal
        isOpen={false}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('Edit group')).to.not.exist;
  });

  it('shows a name input prefilled with the group name and a color select prefilled with the group color', function () {
    render(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Edit group')).to.be.visible;

    const nameInput = screen.getByTestId<HTMLInputElement>(
      'edit-group-name-input'
    );
    expect(nameInput.value).to.equal('Production');

    const colorSelect = screen.getByTestId('edit-group-color-input');
    expect(within(colorSelect).getByText('Green')).to.be.visible;
  });

  it('calls onSubmit with the edited name and the existing color when Save is clicked', function () {
    const onSubmit = sinon.spy();
    render(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    );

    const nameInput = screen.getByTestId('edit-group-name-input');
    userEvent.clear(nameInput);
    userEvent.type(nameInput, 'Renamed group');

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).to.have.been.calledOnceWithExactly({
      name: 'Renamed group',
      color: 'color1',
    });
  });

  it('disables Save when the name is empty', function () {
    render(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    );

    const nameInput = screen.getByTestId('edit-group-name-input');
    userEvent.clear(nameInput);

    expect(
      screen.getByRole('button', { name: 'Save' }).getAttribute('aria-disabled')
    ).to.equal('true');
  });

  it('calls onSubmit with the newly selected color', function () {
    const onSubmit = sinon.spy();
    render(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={onSubmit}
        onClose={() => {}}
      />
    );

    const colorSelectButton = screen.getByTestId('edit-group-color-input');
    userEvent.click(colorSelectButton);

    const menuId = colorSelectButton.getAttribute('aria-controls');
    const listbox = document.querySelector(
      `[id="${menuId}"][role="listbox"]`
    ) as HTMLElement;
    userEvent.click(within(listbox).getByText('Teal'));

    userEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).to.have.been.calledOnceWithExactly({
      name: 'Production',
      color: 'color2',
    });
  });

  it('calls onClose when Cancel is clicked', function () {
    const onClose = sinon.spy();
    render(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={() => {}}
        onClose={onClose}
      />
    );

    userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).to.have.been.calledOnce;
  });

  it('re-seeds the name and color fields when the group prop changes', function () {
    const { rerender } = render(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g1', name: 'Production', color: 'color1' }}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    );

    rerender(
      <EditGroupModal
        isOpen={true}
        group={{ id: 'g2', name: 'Staging', color: 'color2' }}
        onSubmit={() => {}}
        onClose={() => {}}
      />
    );

    const nameInput = screen.getByTestId<HTMLInputElement>(
      'edit-group-name-input'
    );
    expect(nameInput.value).to.equal('Staging');
    expect(
      within(screen.getByTestId('edit-group-color-input')).getByText('Teal')
    ).to.be.visible;
  });
});

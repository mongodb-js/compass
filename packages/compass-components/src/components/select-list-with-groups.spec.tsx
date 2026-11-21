import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { SelectListWithGroups } from './select-list-with-groups';

type TestItem = {
  id: string;
  selected: boolean;
  disabled?: boolean;
  label: string;
};

const label = { displayLabelKey: 'label' as const, name: 'Connections' };

function ariaChecked(testId: string) {
  return screen
    .getByTestId(testId)
    .closest('input')
    ?.getAttribute('aria-checked');
}

function click(testId: string) {
  userEvent.click(screen.getByTestId(testId), undefined, {
    skipPointerEventsCheck: true,
  });
}

describe('SelectListWithGroups', function () {
  let groups: { id: string; name: string; items: TestItem[] }[];
  let onChange: sinon.SinonStub;

  beforeEach(function () {
    groups = [
      {
        id: 'g1',
        name: 'Group 1',
        items: [
          { id: 'a', selected: true, label: 'A' },
          { id: 'b', selected: false, label: 'B' },
        ],
      },
      {
        id: 'g2',
        name: 'Group 2',
        items: [{ id: 'c', selected: true, label: 'C' }],
      },
    ];
    onChange = sinon.stub();
  });

  function renderList(disabled?: boolean) {
    render(
      <SelectListWithGroups
        groups={groups}
        label={label}
        onChange={onChange}
        disabled={disabled}
      />
    );
  }

  it('renders group names, items and counts', function () {
    renderList();
    expect(screen.getByText('Group 1')).to.be.visible;
    expect(screen.getByLabelText('B')).to.be.visible;
    expect(
      screen.getByTestId('select-list-group-g1-count').textContent
    ).to.equal('1 / 2');
    expect(
      screen.getByTestId('select-list-group-g2-count').textContent
    ).to.equal('1 / 1');
  });

  it('reflects selection state on the all and group checkboxes', function () {
    renderList();
    expect(ariaChecked('select-list-all-checkbox')).to.equal('mixed');
    expect(ariaChecked('select-list-group-g1-checkbox')).to.equal('mixed');
    expect(ariaChecked('select-list-group-g2-checkbox')).to.equal('true');
  });

  it('disables the group checkbox when all its items are disabled', function () {
    groups[1].items[0].disabled = true;
    renderList();
    expect(
      screen.getByTestId('select-list-group-g2-checkbox').closest('input')
        ?.ariaDisabled
    ).to.equal('true');
    expect(
      screen.getByTestId('select-list-all-checkbox').closest('input')
        ?.ariaDisabled
    ).to.not.equal('true');
  });

  it('disables everything when the component is disabled', function () {
    renderList(true);
    for (const id of [
      'select-list-all-checkbox',
      'select-list-group-g1-checkbox',
      'select-a',
    ]) {
      expect(screen.getByTestId(id).closest('input')?.ariaDisabled).to.equal(
        'true'
      );
    }
  });

  it('select all affects every enabled item and returns a flat list in order', function () {
    groups[0].items[1].disabled = true;
    renderList();
    click('select-list-all-checkbox');
    expect(onChange).to.have.been.calledWith([
      { id: 'a', selected: true, label: 'A' },
      { id: 'b', selected: false, disabled: true, label: 'B' },
      { id: 'c', selected: true, label: 'C' },
    ]);
  });

  it('group select all affects only that group', function () {
    renderList();
    click('select-list-group-g1-checkbox');
    expect(onChange).to.have.been.calledWith([
      { id: 'a', selected: true, label: 'A' },
      { id: 'b', selected: true, label: 'B' },
      { id: 'c', selected: true, label: 'C' },
    ]);
  });

  it('group deselect all affects only that group', function () {
    renderList();
    click('select-list-group-g2-checkbox');
    expect(onChange).to.have.been.calledWith([
      { id: 'a', selected: true, label: 'A' },
      { id: 'b', selected: false, label: 'B' },
      { id: 'c', selected: false, label: 'C' },
    ]);
  });

  it('toggles a single item', function () {
    renderList();
    click('select-b');
    expect(onChange).to.have.been.calledWith([
      { id: 'a', selected: true, label: 'A' },
      { id: 'b', selected: true, label: 'B' },
      { id: 'c', selected: true, label: 'C' },
    ]);
  });
});

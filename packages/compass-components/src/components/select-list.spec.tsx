import {
  render,
  screen,
  fireEvent,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { SelectList } from './select-list';
import { cloneDeep } from 'lodash';

type TestItem = {
  id: string;
  selected: boolean;
  col1: string;
  col2: string;
};

describe('SelectList', function () {
  let items: TestItem[];
  let label: { displayLabelKey: keyof TestItem; name: string | JSX.Element };
  let onChange: sinon.SinonStub;

  beforeEach(function () {
    items = [
      { id: 'id1', selected: true, col1: '1x1', col2: '1x2' },
      { id: 'id2', selected: true, col1: '2x1', col2: '2x2' },
    ];
    label = { displayLabelKey: 'col1', name: 'Column1' };
    onChange = sinon.stub();
  });

  afterEach(function () {
    cleanup();
  });

  describe('render', function () {
    it('allows listing multiple selectable items in the list', function () {
      render(<SelectList items={items} label={label} onChange={onChange} />);

      expect(screen.getByLabelText('1x1')).to.be.visible;
    });

    it('renders checkboxes as expected when all items are selected', function () {
      render(<SelectList items={items} label={label} onChange={onChange} />);

      expect(
        screen.getByTestId('select-list-all-checkbox').closest('input')?.checked
      ).to.equal(true);
      expect(
        screen
          .getByTestId('select-list-all-checkbox')
          .closest('input')
          ?.getAttribute('aria-checked')
      ).to.equal('true');
      expect(
        screen.getByTestId('select-id1').closest('input')?.checked
      ).to.equal(true);
      expect(
        screen.getByTestId('select-id2').closest('input')?.checked
      ).to.equal(true);
    });

    it('renders checkboxes as expected when no items are selected', function () {
      items[0].selected = false;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      expect(
        screen.getByTestId('select-list-all-checkbox').closest('input')?.checked
      ).to.equal(false);
      expect(
        screen
          .getByTestId('select-list-all-checkbox')
          .closest('input')
          ?.getAttribute('aria-checked')
      ).to.equal('false');
      expect(
        screen.getByTestId('select-id1').closest('input')?.checked
      ).to.equal(false);
      expect(
        screen.getByTestId('select-id2').closest('input')?.checked
      ).to.equal(false);
    });

    it('renders checkboxes as expected when some items are selected', function () {
      items[0].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      expect(
        screen.getByTestId('select-list-all-checkbox').closest('input')?.checked
      ).to.equal(false);
      expect(
        screen
          .getByTestId('select-list-all-checkbox')
          .closest('input')
          ?.getAttribute('aria-checked')
      ).to.equal('mixed');
      expect(
        screen.getByTestId('select-id1').closest('input')?.checked
      ).to.equal(false);
      expect(
        screen.getByTestId('select-id2').closest('input')?.checked
      ).to.equal(true);
    });
  });

  describe('updates', function () {
    it('calls onChange when a single item is selected', function () {
      const originalItems = cloneDeep(items);
      items[0].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('select-id1'));
      expect(onChange).to.have.been.calledWith(originalItems);
    });

    it('calls onChange when a single item is deselected', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('select-id1'));
      expect(onChange).to.have.been.calledWith(expectedItems);
    });

    it('calls onChange when all items are selected', function () {
      const originalItems = cloneDeep(items);
      items[0].selected = false;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('select-list-all-checkbox'));
      expect(onChange).to.have.been.calledWith(originalItems);
    });

    it('calls onChange when all items are deselected', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      fireEvent.click(screen.getByTestId('select-list-all-checkbox'));
      expect(onChange).to.have.been.calledWith(expectedItems);
    });
  });
});

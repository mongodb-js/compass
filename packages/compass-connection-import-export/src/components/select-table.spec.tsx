import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { SelectTable } from './select-table';
import { cloneDeep } from 'lodash';

type TestItem = {
  id: string;
  selected: boolean;
  col1: string;
  col2: string;
};

describe('SelectTable', function () {
  let items: TestItem[];
  let columns: [key: keyof TestItem, label: string | JSX.Element][];
  let onChange: sinon.SinonStub;

  beforeEach(function () {
    items = [
      { id: 'id1', selected: true, col1: '1x1', col2: '1x2' },
      { id: 'id2', selected: true, col1: '2x1', col2: '2x2' },
    ];
    columns = [
      ['col1', 'Column1'],
      [
        'col2',
        <span key="" data-testid="column2-span">
          Column2
        </span>,
      ],
    ];
    onChange = sinon.stub();
  });

  afterEach(function () {
    cleanup();
  });

  describe('render', function () {
    it('allows listing multiple selectable items in a table', function () {
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      expect(screen.getByTestId('column2-span')).to.be.visible;
      expect(screen.getByTestId('item-id1-col1')).to.have.text('1x1');
      expect(screen.getByTestId('item-id1-col2')).to.have.text('1x2');
    });

    it('renders checkboxes as expected when all items are selected', function () {
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      expect(
        screen.getByTestId('select-table-all-checkbox').closest('input')
          ?.checked
      ).to.equal(true);
      expect(
        screen
          .getByTestId('select-table-all-checkbox')
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
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      expect(
        screen.getByTestId('select-table-all-checkbox').closest('input')
          ?.checked
      ).to.equal(false);
      expect(
        screen
          .getByTestId('select-table-all-checkbox')
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
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      expect(
        screen.getByTestId('select-table-all-checkbox').closest('input')
          ?.checked
      ).to.equal(false);
      expect(
        screen
          .getByTestId('select-table-all-checkbox')
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
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      fireEvent.click(screen.getByTestId('select-id1'));
      expect(onChange).to.have.been.calledWith(originalItems);
    });

    it('calls onChange when a single item is deselected', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      fireEvent.click(screen.getByTestId('select-id1'));
      expect(onChange).to.have.been.calledWith(expectedItems);
    });

    it('calls onChange when all items are selected', function () {
      const originalItems = cloneDeep(items);
      items[0].selected = false;
      items[1].selected = false;
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      fireEvent.click(screen.getByTestId('select-table-all-checkbox'));
      expect(onChange).to.have.been.calledWith(originalItems);
    });

    it('calls onChange when all items are deselected', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      items[1].selected = false;
      render(
        <SelectTable items={items} columns={columns} onChange={onChange} />
      );

      fireEvent.click(screen.getByTestId('select-table-all-checkbox'));
      expect(onChange).to.have.been.calledWith(expectedItems);
    });
  });
});

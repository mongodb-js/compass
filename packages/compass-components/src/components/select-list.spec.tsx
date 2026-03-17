import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { SelectList } from './select-list';
import { cloneDeep } from 'lodash';

type TestItem = {
  id: string;
  selected: boolean;
  disabled?: boolean;
  label: string;
};

describe('SelectList', function () {
  let items: TestItem[];
  let label: { displayLabelKey: keyof TestItem; name: string | JSX.Element };
  let onChange: sinon.SinonStub;

  beforeEach(function () {
    items = [
      { id: 'id1', selected: true, label: '1x1' },
      { id: 'id2', selected: true, label: '2x1' },
    ];
    label = { displayLabelKey: 'label', name: 'Select Option' };
    onChange = sinon.stub();
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

    it('renders checkall checkbox as disabled - when all items are disabled', function () {
      items[0].disabled = true;
      items[1].disabled = true;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      expect(
        screen.getByTestId('select-list-all-checkbox').closest('input')
          ?.ariaDisabled
      ).to.equal('true');
    });

    it('renders checkall checkbox as disabled - when component prop is disabled', function () {
      render(
        <SelectList
          items={items}
          label={label}
          onChange={onChange}
          disabled={true}
        />
      );
      expect(
        screen.getByTestId('select-list-all-checkbox').closest('input')
          ?.ariaDisabled
      ).to.equal('true');
    });
  });

  describe('updates', function () {
    it('calls onChange when a single item is selected', function () {
      const originalItems = cloneDeep(items);
      items[0].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      userEvent.click(screen.getByTestId('select-id1'), undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onChange).to.have.been.calledWith(originalItems);
    });

    it('calls onChange when a single item is deselected', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      userEvent.click(screen.getByTestId('select-id1'), undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onChange).to.have.been.calledWith(expectedItems);
    });

    it('calls onChange when all items are selected', function () {
      const originalItems = cloneDeep(items);
      items[0].selected = false;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      userEvent.click(
        screen.getByTestId('select-list-all-checkbox'),
        undefined,
        { skipPointerEventsCheck: true }
      );
      expect(onChange).to.have.been.calledWith(originalItems);
    });

    it('calls onChange when all items are deselected', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      userEvent.click(
        screen.getByTestId('select-list-all-checkbox'),
        undefined,
        { skipPointerEventsCheck: true }
      );
      expect(onChange).to.have.been.calledWith(expectedItems);
    });
    it('calls onChange with disabled items left unchanged - using checkall box', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      items[0].disabled = true;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      userEvent.click(
        screen.getByTestId('select-list-all-checkbox'),
        undefined,
        { skipPointerEventsCheck: true }
      );

      expect(onChange).to.have.been.calledWith([
        { ...expectedItems[0], selected: false, disabled: true },
        { ...expectedItems[1], selected: true },
      ]);
    });
    it('calls onChange with disabled items left unchanged - using individual checkbox', function () {
      const expectedItems = cloneDeep(items);
      items[0].selected = false;
      items[0].disabled = true;
      items[1].selected = false;
      render(<SelectList items={items} label={label} onChange={onChange} />);

      userEvent.click(screen.getByTestId('select-id1'), undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onChange).to.not.have.been.called;

      userEvent.click(screen.getByTestId('select-id2'), undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onChange).to.have.been.calledWith([
        { ...expectedItems[0], selected: false, disabled: true },
        { ...expectedItems[1], selected: true },
      ]);
    });
  });
});

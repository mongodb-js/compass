import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import { ListEditor } from './list-editor';

function renderListEditor(
  props: Partial<React.ComponentProps<typeof ListEditor>>
) {
  const onAddItemSpy = sinon.spy();
  const onRemoveItemSpy = sinon.spy();

  render(
    <ListEditor
      items={[]}
      renderItem={() => <div />}
      onRemoveItem={onRemoveItemSpy}
      onAddItem={onAddItemSpy}
      {...props}
    />
  );

  return {
    onRemoveItemSpy,
  };
}

describe('ListEditor', function () {
  describe('when rendered with one item', function () {
    beforeEach(function () {
      renderListEditor({
        items: ['pineapple'],
        // eslint-disable-next-line react/display-name
        renderItem: (item) => <div>{item}</div>,
      });
    });

    it('renders the item', function () {
      expect(screen.getByText('pineapple')).to.be.visible;
    });

    it('renders a plus button', function () {
      expect(screen.getByLabelText('Add')).to.be.visible;
    });

    it('does not render a remove button', function () {
      expect(screen.queryByLabelText('Remove')).to.not.exist;
    });
  });

  describe('when rendered with multiple items', function () {
    let onAddItemSpy;
    let onRemoveItemSpy;

    beforeEach(function () {
      onAddItemSpy = sinon.spy();
      onRemoveItemSpy = sinon.spy();

      renderListEditor({
        items: ['one', 'two', 'three'],
        // eslint-disable-next-line react/display-name
        renderItem: (item) => <div>{item}</div>,
        onAddItem: onAddItemSpy,
        onRemoveItem: onRemoveItemSpy,
      });
    });

    it('renders the items', function () {
      expect(screen.getByText('one')).to.be.visible;
      expect(screen.getByText('two')).to.be.visible;
      expect(screen.getByText('three')).to.be.visible;
    });

    it('renders a remove button', function () {
      expect(screen.getAllByLabelText('Remove').length).to.equal(3);
      expect(screen.getAllByLabelText('Remove')[0]).to.be.visible;
    });

    describe('when the remove button is clicked', function () {
      beforeEach(function () {
        const removeHostButton = screen.getAllByLabelText('Remove')[1];
        fireEvent.click(removeHostButton);
      });

      it('should call to remove', function () {
        expect(onRemoveItemSpy.callCount).to.equal(1);
        expect(onRemoveItemSpy.firstCall.args[0]).to.deep.equal(1);
      });
    });

    describe('when the add button is clicked', function () {
      beforeEach(function () {
        const addHostButton = screen.getAllByLabelText('Add')[1];
        fireEvent.click(addHostButton);
      });

      it('should call to add at the location', function () {
        expect(onAddItemSpy.callCount).to.equal(1);
        expect(onAddItemSpy.firstCall.args[0]).to.deep.equal(1);
      });
    });
  });
});

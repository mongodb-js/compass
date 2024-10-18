import React from 'react';
import { expect } from 'chai';
import { screen, userEvent } from '@mongodb-js/testing-library-compass';
import {
  CreateShardKeyForm,
  type CreateShardKeyFormProps,
} from './create-shard-key-form';
import { renderWithStore } from '../../tests/create-store';
import sinon from 'sinon';

function renderWithProps(props?: Partial<CreateShardKeyFormProps>) {
  return renderWithStore(
    <CreateShardKeyForm
      isSubmittingForSharding={false}
      isCancellingSharding={false}
      namespace="airbnb.test"
      onCreateShardKey={() => {}}
      {...props}
    />
  );
}

function setShardingKeyFieldValue(value: string) {
  const input = screen.getByLabelText('Second shard key field');
  expect(input).to.exist;
  userEvent.type(input, value);
  expect(input).to.have.value(value);
  userEvent.keyboard('{Escape}');

  // For some reason, when running tests in electron mode, the value of
  // the input field is not being updated. This is a workaround to ensure
  // the value is being updated before clicking the submit button.
  userEvent.click(screen.getByText(value), undefined, {
    skipPointerEventsCheck: true,
  });
}

describe('CreateShardKeyForm', function () {
  let onCreateShardKeySpy: sinon.SinonSpy;
  context('default', function () {
    beforeEach(async function () {
      onCreateShardKeySpy = sinon.spy();
      await renderWithProps({ onCreateShardKey: onCreateShardKeySpy });
    });

    it('renders location form field as disabled', function () {
      expect(screen.getByLabelText('First shard key field')).to.have.attribute(
        'aria-disabled',
        'true'
      );
    });

    it('does not allow user to submit when no second shard key is selected', function () {
      expect(screen.getByTestId('shard-collection-button')).to.have.attribute(
        'aria-disabled',
        'true'
      );

      userEvent.click(screen.getByTestId('shard-collection-button'));
      expect(onCreateShardKeySpy.called).to.be.false;
    });

    it('allows user to input second shard key and submit it', function () {
      setShardingKeyFieldValue('name');

      userEvent.click(screen.getByTestId('shard-collection-button'));

      expect(onCreateShardKeySpy.calledOnce).to.be.true;
      expect(onCreateShardKeySpy.firstCall.args[0]).to.deep.equal({
        customShardKey: 'name',
        isShardKeyUnique: false,
        isCustomShardKeyHashed: false,
        presplitHashedZones: false,
        numInitialChunks: null,
      });
    });

    it('renders advanced options and radio buttons for: default, unique-index and hashed index', function () {
      const accordian = screen.getByText('Advanced Shard Key Configuration');
      expect(accordian).to.exist;

      userEvent.click(accordian);

      const defaultRadio = screen.getByLabelText('Default');
      const uniqueIndexRadio = screen.getByLabelText(
        'Use unique index as the shard key'
      );
      const hashedIndexRadio = screen.getByLabelText(
        'Use hashed index as the shard key'
      );

      expect(defaultRadio).to.exist;
      expect(uniqueIndexRadio).to.exist;
      expect(hashedIndexRadio).to.exist;
    });

    it('allows user to select unique index as shard key', function () {
      const accordian = screen.getByText('Advanced Shard Key Configuration');
      userEvent.click(accordian);

      const uniqueIndexRadio = screen.getByLabelText(
        'Use unique index as the shard key'
      );
      userEvent.click(uniqueIndexRadio);

      expect(uniqueIndexRadio).to.have.attribute('aria-checked', 'true');

      setShardingKeyFieldValue('name');

      userEvent.click(screen.getByTestId('shard-collection-button'));

      expect(onCreateShardKeySpy.calledOnce).to.be.true;
      expect(onCreateShardKeySpy.firstCall.args[0]).to.deep.equal({
        customShardKey: 'name',
        isShardKeyUnique: true,
        isCustomShardKeyHashed: false,
        presplitHashedZones: false,
        numInitialChunks: null,
      });
    });

    it('allows user to select hashed index as shard key with split-chunks option', function () {
      const accordian = screen.getByText('Advanced Shard Key Configuration');
      userEvent.click(accordian);

      const hashedIndexRadio = screen.getByLabelText(
        'Use hashed index as the shard key'
      );
      userEvent.click(hashedIndexRadio);

      expect(hashedIndexRadio).to.have.attribute('aria-checked', 'true');

      setShardingKeyFieldValue('name');

      // Check pre-split data
      userEvent.click(screen.getByTestId('presplit-data-checkbox'), undefined, {
        skipPointerEventsCheck: true,
      });

      userEvent.click(screen.getByTestId('shard-collection-button'));

      expect(onCreateShardKeySpy.calledOnce).to.be.true;
      expect(onCreateShardKeySpy.firstCall.args[0]).to.deep.equal({
        customShardKey: 'name',
        isShardKeyUnique: false,
        isCustomShardKeyHashed: true,
        presplitHashedZones: true,
        numInitialChunks: null,
      });
    });

    it('allows user to select hashed index as shard key with all its options', function () {
      const accordian = screen.getByText('Advanced Shard Key Configuration');
      userEvent.click(accordian);

      const hashedIndexRadio = screen.getByLabelText(
        'Use hashed index as the shard key'
      );
      userEvent.click(hashedIndexRadio);

      expect(hashedIndexRadio).to.have.attribute('aria-checked', 'true');

      setShardingKeyFieldValue('name');

      // Check pre-split data
      userEvent.click(screen.getByTestId('presplit-data-checkbox'), undefined, {
        skipPointerEventsCheck: true,
      });

      // Enter number of chunks
      userEvent.type(screen.getByTestId('chunks-per-shard-input'), '10');

      userEvent.click(screen.getByTestId('shard-collection-button'));

      expect(onCreateShardKeySpy.calledOnce).to.be.true;
      expect(onCreateShardKeySpy.firstCall.args[0]).to.deep.equal({
        customShardKey: 'name',
        isShardKeyUnique: false,
        isCustomShardKeyHashed: true,
        presplitHashedZones: true,
        numInitialChunks: 10,
      });
    });
  });

  it('cannot be submitted when already submitting', async function () {
    onCreateShardKeySpy = sinon.spy();
    await renderWithProps({
      onCreateShardKey: onCreateShardKeySpy,
      isSubmittingForSharding: true,
    });
    setShardingKeyFieldValue('name');

    userEvent.click(screen.getByTestId('shard-collection-button'));

    expect(onCreateShardKeySpy.calledOnce).to.be.false;
  });

  it('cannot be submitted when cancelling', async function () {
    onCreateShardKeySpy = sinon.spy();
    await renderWithProps({
      onCreateShardKey: onCreateShardKeySpy,
      isCancellingSharding: true,
    });
    setShardingKeyFieldValue('name');

    userEvent.click(screen.getByTestId('shard-collection-button'));

    expect(onCreateShardKeySpy.calledOnce).to.be.false;
  });
});

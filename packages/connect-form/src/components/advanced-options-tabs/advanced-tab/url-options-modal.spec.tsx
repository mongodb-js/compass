import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import UrlOptionsModal from './url-options-modal';

describe('UrlOptionsModal', function () {
  let onUpdateOptionSpy: sinon.SinonSpy;
  let onCloseSpy: sinon.SinonSpy;

  describe('no selectedOption passed', function () {
    beforeEach(function () {
      onUpdateOptionSpy = sinon.spy();
      onCloseSpy = sinon.spy();
      render(
        <UrlOptionsModal
          onClose={onCloseSpy}
          selectedOption={undefined}
          onUpdateOption={onUpdateOptionSpy}
        />
      );
    });

    it('renders uri options modal', function () {
      expect(screen.getByTestId('uri-options-modal')).to.exist;
      // Leafy doesn't render select with the test id
      expect(screen.findByText('Select Key')).to.exist;
      expect(screen.getByTestId('uri-options-value-field')).to.exist;
      expect(screen.getByTestId('uri-options-save-button')).to.exist;
    });

    it('renders empty values when options is not passed', function () {
      expect(
        screen.getByTestId('uri-options-value-field').getAttribute('value')
      ).to.equal('');
      expect(screen.getByLabelText('Key').getAttribute('value')).to.equal('');
    });

    it('sets option when form field on changes', function () {
      fireEvent.change(screen.getByTestId('uri-options-value-field'), {
        target: { value: 'hello' },
      });
      expect(
        screen.getByTestId('uri-options-value-field').getAttribute('value')
      ).to.equal('hello');
      screen.getByLabelText('Key').setAttribute('value', 'w');
      expect(screen.getByLabelText('Key').getAttribute('value')).to.equal('w');
    });

    it('calls onUpdateOption when save button is clicked', async function () {
      fireEvent.change(screen.getByTestId('uri-options-value-field'), {
        target: { value: 'hello' },
      });
      const button = screen.getByTestId('uri-options-save-button');
      fireEvent.click(button);
      expect(await screen.findByText('Please select an options key.')).to.exist;
      expect(
        onUpdateOptionSpy.callCount,
        'validation fails as key is not set in option yet'
      ).to.equal(0);

      // todo: how to trigger onChange on Leafy Select?
      // screen.getByLabelText('Key').setAttribute('value', 'w');
      // fireEvent.click(screen.getByLabelText('Key'));
      // fireEvent.click(button);
      // expect(await screen.findByText('Please select an options key.')).to.not.exist;
      // expect(onUpdateOptionSpy.callCount).to.equal(1);
    });

    it('calls onUpdateOption when user presses return', async function () {
      fireEvent.change(screen.getByTestId('uri-options-value-field'), {
        target: { value: 'hello' },
      });
      const field = screen.getByTestId('uri-options-value-field');
      fireEvent.keyDown(field, { key: 'Enter' });
      expect(await screen.findAllByText('Please select an options key.')).to
        .exist;
      expect(
        onUpdateOptionSpy.callCount,
        'validation fails as key is not set in option yet'
      ).to.equal(0);

      // todo: how to trigger onChange on Leafy Select?
      // screen.getByLabelText('Key').setAttribute('value', 'w');
      // fireEvent.click(screen.getByLabelText('Key'));
      // expect(await screen.findByText('Please select an options key.')).to.not.exist;
      // expect(onUpdateOptionSpy.callCount).to.equal(1);
    });

    it('calls onClose when modal is closed', async function () {
      const closeButton = await screen.findByLabelText('Close modal');
      fireEvent.click(closeButton);
      expect(onCloseSpy.callCount).to.equal(1);
    });
  });

  describe('selectedOption passed', function () {
    beforeEach(function () {
      onUpdateOptionSpy = sinon.spy();
      onCloseSpy = sinon.spy();

      render(
        <UrlOptionsModal
          onClose={onCloseSpy}
          selectedOption={{ key: 'w', value: 'abc' }}
          onUpdateOption={onUpdateOptionSpy}
        />
      );
    });

    it('renders uri options modal', function () {
      expect(screen.getByTestId('uri-options-modal')).to.exist;
      // Leafy doesn't render select with the test id
      expect(screen.findByText('Select Key')).to.exist;
      expect(screen.getByTestId('uri-options-value-field')).to.exist;
      expect(screen.getByTestId('uri-options-save-button')).to.exist;
    });

    it('renders values when options is passed', function () {
      expect(
        screen.getByTestId('uri-options-value-field').getAttribute('value')
      ).to.equal('abc');
      expect(screen.getByLabelText('Key').getAttribute('value')).to.equal('w');
    });

    it('sets option when form field on changes', function () {
      fireEvent.change(screen.getByTestId('uri-options-value-field'), {
        target: { value: 'hello' },
      });
      expect(
        screen.getByTestId('uri-options-value-field').getAttribute('value')
      ).to.equal('hello');
      screen.getByLabelText('Key').setAttribute('value', 'journal');
      expect(screen.getByLabelText('Key').getAttribute('value')).to.equal(
        'journal'
      );
    });

    it('calls onUpdateOption when save button is clicked', function () {
      fireEvent.change(screen.getByTestId('uri-options-value-field'), {
        target: { value: 'hello' },
      });
      const button = screen.getByTestId('uri-options-save-button');
      fireEvent.click(button);
      expect(onUpdateOptionSpy.callCount).to.equal(1);
    });

    it('calls onUpdateOption when user presses return', function () {
      fireEvent.change(screen.getByTestId('uri-options-value-field'), {
        target: { value: 'hello' },
      });
      const field = screen.getByTestId('uri-options-value-field');
      fireEvent.keyDown(field, { key: 'Enter' });
      expect(onUpdateOptionSpy.callCount).to.equal(1);
    });

    it('calls onClose when modal is closed', async function () {
      const closeButton = await screen.findByLabelText('Close modal');
      fireEvent.click(closeButton);
      expect(onCloseSpy.callCount).to.equal(1);
    });
  });
});

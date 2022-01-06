import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import UrlOptionsTable from './url-options-table';

// Editable url options
const urlOptions = [
  {
    key: 'w',
    value: 'w-value',
  },
  {
    key: 'journal',
    value: 'j-value',
  },
];

const connectionStringUrl = new ConnectionStringUrl(
  'mongodb+srv://0ranges:p!neapp1es@localhost/'
);
urlOptions.forEach(({ key, value }) => {
  connectionStringUrl.searchParams.set(key, value);
});

describe('UrlOptionsTable', function () {
  let updateConnectionFormFieldSpy: sinon.SinonSpy;

  describe('with SearchParams', function () {
    beforeEach(function () {
      updateConnectionFormFieldSpy = sinon.spy();
      // add option that's not in Editable url options
      connectionStringUrl.searchParams.set('readPreferences', 'primary');
      render(
        <UrlOptionsTable
          updateConnectionFormField={updateConnectionFormFieldSpy}
          connectionStringUrl={connectionStringUrl}
        />
      );
    });

    it('renders view correctly', function () {
      expect(
        screen.getByTestId('url-options-table'),
        'options table when CS has search params'
      ).to.exist;
      expect(screen.getByTestId('add-url-options-button'), 'add new button').to
        .exist;
    });

    it('should not render options that are not editable, but in CS', function () {
      expect(() => {
        screen.getByTestId('readPreferences-table-row');
      }).to.throw;
      expect(() => {
        screen.getByTestId('readPreferences-input-field');
      }).to.throw;
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    urlOptions.forEach(({ key, value }) => {
      it(`renders url option in a table row - ${key}`, function () {
        expect(screen.getByTestId(`${key}-table-row`), `${key} options row`).to
          .exist;
        expect(
          screen.getByTestId(`${key}-input-field`).getAttribute('value')
        ).to.equal(value);
      });
    });

    it('renders new option entry with no value when user clicks on add new button', function () {
      const button = screen.getByTestId('add-url-options-button');
      fireEvent.click(button);

      expect(screen.getByTestId('new-option-table-row')).to.exist;
      expect(
        screen.getByTestId('new-option-input-field').getAttribute('value')
      ).to.equal('');
    });

    it('renders error message when user clicks twice add new button', function () {
      const button = screen.getByTestId('add-url-options-button');
      fireEvent.click(button);
      fireEvent.click(button);
      expect(screen.findByText('Please complete existing option.')).to.exist;
    });

    it('renders selected key when user select a key', function () {
      // todo: how to test Leafy Select?
    });

    it('renders input value when user changes value', function () {
      fireEvent.click(screen.getByTestId('add-url-options-button'));
      fireEvent.change(screen.getByTestId('new-option-input-field'), {
        target: { value: 'hello' },
      });
      expect(
        screen.getByTestId('new-option-input-field').getAttribute('value')
      ).to.equal('hello');
      expect(
        updateConnectionFormFieldSpy.callCount,
        'should not call updateConnectionFormFieldSpy when name is not selected'
      ).to.equal(0);
    });

    it('should update an option - when name changes', function () {
      // todo: how to test Leafy Select?
    });

    it('should update an option and call updateConnectionFormFieldSpy - when value changes', function () {
      fireEvent.change(screen.getByTestId('w-input-field'), {
        target: { value: 'hello' },
      });

      expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
      expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
        type: 'update-search-param',
        currentKey: 'w', // The changed key
        newKey: undefined, // Key does not change
        value: 'hello',
      });
    });

    it('should delete a new option', function () {
      fireEvent.click(screen.getByTestId('add-url-options-button'));
      fireEvent.click(screen.getByTestId('new-option-delete-button'));
      expect(() => {
        screen.getByTestId('new-option-table-row');
      }).to.throw;
      expect(updateConnectionFormFieldSpy.callCount).to.equal(0);
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    urlOptions.forEach(({ key }) => {
      it(`should delete an option - ${key}`, function () {
        fireEvent.click(screen.getByTestId(`${key}-delete-button`));
        expect(() => {
          screen.getByTestId(`${key}-table-row`);
        }).to.throw;
        expect(updateConnectionFormFieldSpy.callCount).to.equal(1);
        expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
          type: 'delete-search-param',
          key,
        });
      });
    });
  });

  describe('without SearchParams', function () {
    beforeEach(function () {
      render(
        <UrlOptionsTable
          updateConnectionFormField={updateConnectionFormFieldSpy}
          connectionStringUrl={
            new ConnectionStringUrl(
              'mongodb+srv://0ranges:p!neapp1es@localhost/'
            )
          }
        />
      );
    });

    it('renders view correctly', function () {
      expect(() => {
        screen.getByTestId('url-options-table');
      }).to.throw;
      expect(screen.getByTestId('add-url-options-button'), 'add new button').to
        .exist;
    });

    it('renders tables when user clicks on add url options', function () {
      fireEvent.click(screen.getByTestId('add-url-options-button'));
      expect(screen.getByTestId('url-options-table')).to.exist;
    });
  });
});

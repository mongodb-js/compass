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

describe('UrlOptions', function () {
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

    it('should not render options that are not editable, but are in ConnectionString', function () {
      expect(screen.queryByTestId('readPreferences-input-field')).to.not.exist;
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    urlOptions.forEach(({ key, value }) => {
      it(`renders url option - ${key}`, function () {
        expect(
          screen.getByTestId(`${key}-input-field`).getAttribute('value')
        ).to.equal(value);
      });
    });

    it('renders selected key when user select a key', function () {
      fireEvent.click(screen.getByText(/select key/i)); // Click select button
      fireEvent.click(screen.getByText(/appname/i)); // Select the option

      // After click, the options list should disappear
      expect(() => {
        screen.getByRole('listbox');
      }).to.throw;

      expect(screen.getByText(/appname/i)).to.exist;

      expect(
        updateConnectionFormFieldSpy.callCount,
        'it calls update when name is selected'
      ).to.equal(1);
      expect(updateConnectionFormFieldSpy.args[0][0]).to.deep.equal({
        type: 'update-search-param',
        currentKey: 'appName',
        newKey: 'appName',
        value: '',
      });
    });

    it('renders input value when user changes value', function () {
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
      fireEvent.click(screen.getByText(/select key/i)); // Click select button
      fireEvent.click(screen.getByText(/appname/i)); // Select the option

      fireEvent.click(screen.getByText(/appname/i)); // Click select button with appName option
      fireEvent.click(screen.getByText(/compressors/i)); // Select the new option
      expect(screen.getByText(/compressors/i)).to.exist;
      expect(
        updateConnectionFormFieldSpy.callCount,
        'it calls update when name is selected'
      ).to.equal(2);
      expect(updateConnectionFormFieldSpy.args[1][0]).to.deep.equal({
        type: 'update-search-param',
        currentKey: 'appName',
        newKey: 'compressors',
        value: '',
      });

      expect(screen.getByText(/select key/i)).to.exist; // renders an empty new option
    });

    it('should update an option - when value changes', function () {
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

    it('should not render a delete button for a new option', function () {
      expect(screen.queryByTestId('new-option-delete-button')).to.not.exist;
    });

    // eslint-disable-next-line mocha/no-setup-in-describe
    urlOptions.forEach(({ key }) => {
      it(`should delete an option - ${key}`, function () {
        fireEvent.click(screen.getByTestId(`${key}-delete-button`));
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

    it('renders new option fields', function () {
      expect(
        screen.getByTestId('new-option-input-field').getAttribute('value')
      ).to.equal('');
    });
  });
});

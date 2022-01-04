import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import ConnectionStringUrl from 'mongodb-connection-string-url';

import UrlOptions from './url-options';

// Editable url options
const urlOptions = [
  {
    key: 'w',
    value: 'w-value'
  },
  {
    key: 'journal',
    value: 'j-value'
  },
];

const connectionStringUrl = new ConnectionStringUrl(
  'mongodb+srv://0ranges:p!neapp1es@localhost/'
);
urlOptions.forEach(({key, value}) => {
  connectionStringUrl.searchParams.set(key, value);
});

describe('UrlOptions', function() {

  let handleFieldChangedSpy: sinon.SinonSpy;

  beforeEach(function () {
    handleFieldChangedSpy = sinon.spy();
    // add option that's not in Editable url options
    connectionStringUrl.searchParams.set('readPreferences', 'primary');
    render(
      <UrlOptions
        handleFieldChanged={handleFieldChangedSpy}
        connectionStringUrl={connectionStringUrl}
      />
    );
  });

  it('renders view correctly', function() {
    expect(screen.getByTestId('url-options-table'), 'options table').to.exist;
    expect(screen.getByText('w-value'), 'table row based on connection string url').to.exist;
    expect(screen.getByText('j-value'), 'table row based on connection string url').to.exist;

    expect(screen.getByTestId('add-url-options-button'), 'add new button').to.exist;
  });

  it('renders modal with no form value when user clicks on add new button', function() {
    const button = screen.getByTestId('add-url-options-button');
    fireEvent.click(button);

    expect(screen.getByTestId('uri-options-modal')).to.exist;
    expect(screen.getByTestId('uri-options-value-field').getAttribute('value')).to.equal('');
    expect(screen.getByLabelText('Key').getAttribute('value')).to.equal('');
  });

  it('renders only editable url options', function() {
    expect(() => {
      screen.getByText('primary')
    }, 'primary is not in editable url options').to.throw;
    expect(() => {
      screen.getByText('readPreferences')
    }, 'primary is not in editable url options').to.throw;
  });

  // eslint-disable-next-line mocha/no-setup-in-describe
  urlOptions.forEach(({key, value}) => {
    it(`renders modal with form value when user clicks an edit button - ${key}`, async function() {
      fireEvent.click(screen.getByLabelText(`Edit option: ${key}`));
      expect(screen.getByTestId('uri-options-modal')).to.exist;
      expect(screen.getByTestId('uri-options-value-field').getAttribute('value')).to.equal(value);
      expect(screen.getByLabelText('Key').getAttribute('value')).to.equal(key);
      // close the modal
      fireEvent.click(await screen.findByLabelText('Close modal'));
    })
  });

  it('updates url option', function() {
    fireEvent.click(screen.getByLabelText(`Edit option: w`));
    expect(screen.getByTestId('uri-options-modal')).to.exist;
    fireEvent.change(screen.getByTestId('uri-options-value-field'), { target: { value: 'hello'} });
    fireEvent.click(screen.getByTestId('uri-options-save-button'));

    expect(handleFieldChangedSpy.callCount).to.equal(1);
    expect(handleFieldChangedSpy.args[0]).to.deep.equal(['w', 'hello']);

    expect(() => {
      screen.getByText('uri-options-modal')
    }).to.throw;
  });
});
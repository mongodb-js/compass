import React from 'react';
import {
  render,
  screen,
  userEvent,
  fireEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';

import ConnectionForm from '../../connection-form';

function renderForm(
  connectionString: string,
  onConnectClicked: sinon.SinonSpy = sinon.spy()
) {
  render(
    <ConnectionForm
      initialConnectionInfo={{
        id: 'test',
        connectionOptions: { connectionString },
      }}
      onConnectClicked={onConnectClicked}
    />
  );
  userEvent.click(screen.getByTestId('advanced-connection-options'));
  userEvent.click(screen.getByTestId('connection-advanced-tab'));
}

function getConnectionString(): string {
  return screen.getByTestId<HTMLTextAreaElement>('connectionString').value;
}

function getTagSetInputs(): HTMLInputElement[] {
  return screen.getAllByTestId<HTMLInputElement>('read-preference-tags-input');
}

function selectMode(name: string) {
  // LeafyGreen visually hides the native radio input behind its styled box.
  userEvent.click(screen.getByRole('radio', { name }), undefined, {
    skipPointerEventsCheck: true,
  });
}

describe('ReadPreferenceForm', function () {
  it('hides tag sets and max staleness when the mode is default or primary', function () {
    renderForm('mongodb://localhost:27017/');
    expect(screen.queryByTestId('read-preference-tags-input')).to.not.exist;
    expect(screen.queryByTestId('max-staleness-seconds-input')).to.not.exist;

    selectMode('Primary');
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=primary'
    );
    expect(screen.queryByTestId('read-preference-tags-input')).to.not.exist;
    expect(screen.queryByTestId('max-staleness-seconds-input')).to.not.exist;
  });

  it('removes the read preference when default is selected', function () {
    renderForm('mongodb://localhost:27017/?readPreference=nearest');
    selectMode('Default');
    expect(getConnectionString()).to.equal('mongodb://localhost:27017/');
  });

  it('writes multiple tag sets, including an empty fallback set, to the connection string', function () {
    renderForm('mongodb://localhost:27017/');
    selectMode('Secondary');

    userEvent.type(getTagSetInputs()[0], 'region:South,datacenter:A');
    userEvent.click(screen.getByTestId('read-preference-tags-add-button'));
    userEvent.type(getTagSetInputs()[1], 'rack:rack-1');
    userEvent.click(
      screen.getAllByTestId('read-preference-tags-add-button')[1]
    );

    expect(getTagSetInputs()).to.have.lengthOf(3);
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=secondary' +
        '&readPreferenceTags=region%3ASouth%2Cdatacenter%3AA' +
        '&readPreferenceTags=rack%3Arack-1' +
        '&readPreferenceTags='
    );
  });

  it('does not write a lone empty tag set', function () {
    renderForm(
      'mongodb://localhost:27017/?readPreference=secondary&readPreferenceTags=a:b'
    );
    userEvent.clear(getTagSetInputs()[0]);
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=secondary'
    );
  });

  it('removes a tag set', function () {
    renderForm(
      'mongodb://localhost:27017/?readPreference=nearest&readPreferenceTags=a:b&readPreferenceTags=c:d'
    );
    expect(getTagSetInputs().map((input) => input.value)).to.deep.equal([
      'a:b',
      'c:d',
    ]);

    userEvent.click(
      screen.getAllByTestId('read-preference-tags-remove-button')[0]
    );
    expect(getTagSetInputs().map((input) => input.value)).to.deep.equal([
      'c:d',
    ]);
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=nearest&readPreferenceTags=c%3Ad'
    );
  });

  it('writes max staleness seconds to the connection string', function () {
    renderForm('mongodb://localhost:27017/?readPreference=secondaryPreferred');
    fireEvent.change(screen.getByTestId('max-staleness-seconds-input'), {
      target: { value: '120' },
    });
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=secondaryPreferred&maxStalenessSeconds=120'
    );
  });

  it('keeps tag sets and max staleness out of the connection string while primary is selected and restores them afterwards', function () {
    renderForm(
      'mongodb://localhost:27017/?readPreference=secondary&readPreferenceTags=a:b&maxStalenessSeconds=100'
    );

    selectMode('Primary');
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=primary'
    );

    selectMode('Nearest');
    expect(getConnectionString()).to.equal(
      'mongodb://localhost:27017/?readPreference=nearest&readPreferenceTags=a%3Ab&maxStalenessSeconds=100'
    );
    expect(getTagSetInputs()[0].value).to.equal('a:b');
    expect(
      screen.getByTestId<HTMLInputElement>('max-staleness-seconds-input').value
    ).to.equal('100');
  });

  it('does not list tag sets or max staleness as URI options', function () {
    renderForm(
      'mongodb://localhost:27017/?readPreference=secondary&readPreferenceTags=a:b&maxStalenessSeconds=100'
    );
    // Only the empty entry for adding a new option is rendered.
    expect(screen.getAllByTestId(/^url-option-entry-/)).to.have.lengthOf(1);
  });

  describe('validation', function () {
    it('shows an error for a malformed tag set and does not connect', async function () {
      const onConnectClicked = sinon.spy();
      renderForm(
        'mongodb://localhost:27017/?readPreference=secondary&readPreferenceTags=a:b&readPreferenceTags=oops',
        onConnectClicked
      );
      userEvent.click(screen.getByRole('button', { name: 'Connect' }));
      await waitFor(() => {
        expect(
          screen.getAllByText(
            'Tag sets must be in the format key0:value0,key1:value1.'
          )[0]
        ).to.be.visible;
      });
      expect(onConnectClicked).to.not.have.been.called;
    });

    it('shows an error when max staleness is below 90 seconds', async function () {
      const onConnectClicked = sinon.spy();
      renderForm(
        'mongodb://localhost:27017/?readPreference=secondary&maxStalenessSeconds=10',
        onConnectClicked
      );
      userEvent.click(screen.getByRole('button', { name: 'Connect' }));
      await waitFor(() => {
        expect(
          screen.getAllByText('Max staleness must be at least 90 seconds.')[0]
        ).to.be.visible;
      });
      expect(onConnectClicked).to.not.have.been.called;
    });

    it('connects with valid tag sets, an empty fallback set, and max staleness', function () {
      const onConnectClicked = sinon.spy();
      renderForm(
        'mongodb://localhost:27017/?readPreference=secondary&readPreferenceTags=a:b,c:d&readPreferenceTags=&maxStalenessSeconds=90',
        onConnectClicked
      );
      userEvent.click(screen.getByRole('button', { name: 'Connect' }));
      expect(onConnectClicked).to.have.been.calledOnce;
    });

    it('does not connect when tags are pasted with the primary mode', async function () {
      const onConnectClicked = sinon.spy();
      renderForm(
        'mongodb://localhost:27017/?readPreference=primary&readPreferenceTags=a:b',
        onConnectClicked
      );
      userEvent.click(screen.getByRole('button', { name: 'Connect' }));
      await waitFor(() => {
        expect(
          screen.getByText(
            'Read preference tags and max staleness can only be used with a read preference other than primary.'
          )
        ).to.be.visible;
      });
      expect(onConnectClicked).to.not.have.been.called;
    });
  });
});

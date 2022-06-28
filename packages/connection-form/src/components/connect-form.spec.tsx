import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  getByText,
} from '@testing-library/react';
import { expect } from 'chai';

import ConnectForm from './connect-form';

const noop = (): any => {
  /* no-op */
};

function renderForm() {
  return render(
    <ConnectForm
      onConnectClicked={noop}
      initialConnectionInfo={{
        id: 'test',
        connectionOptions: {
          connectionString: 'mongodb://pineapple:orangutans@localhost:27019',
        },
      }}
      onSaveConnectionClicked={noop}
    />
  );
}

describe('ConnectForm Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the heading', function () {
    renderForm();
    expect(screen.getByRole('heading')).to.have.text('New Connection');
  });

  it('should show the connect button', function () {
    renderForm();
    const button = screen.getByText('Connect').closest('button');
    expect(button).to.not.match('disabled');
  });

  it('should render the connection string textbox', function () {
    renderForm();
    const textArea = screen.getByRole('textbox');
    expect(textArea).to.have.text('mongodb://pineapple:*****@localhost:27019/');
  });

  it('should render an error with an invalid connection string', function () {
    render(
      <ConnectForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );
    expect(screen.getByText('Invalid connection string "pineapples"')).to.be
      .visible;
  });

  it('should not show to save a connection when onSaveConnectionClicked doesnt exist', function () {
    render(
      <ConnectForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
      />
    );
    expect(screen.queryByText('FAVORITE')).to.not.exist;
  });

  it('should show a button to save a connection when onSaveConnectionClicked exists', function () {
    render(
      <ConnectForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );
    expect(screen.getByText('FAVORITE').closest('button')).to.be.visible;
  });

  it('should show the saved connection modal when the favorite button is clicked', function () {
    render(
      <ConnectForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );

    expect(screen.queryByText('Save connection to favorites')).to.not.exist;

    fireEvent.click(screen.getByText('FAVORITE').closest('button'));

    expect(screen.getByText('Save connection to favorites')).to.be.visible;
  });

  it('should render a connection error', function () {
    render(
      <ConnectForm
        onConnectClicked={() => {
          /* */
        }}
        connectionErrorMessage="connection error"
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        }}
      />
    );

    expect(screen.getByText('connection error')).to.be.visible;
  });

  it('should show a Save & Connect button when there is no existing connection', function () {
    render(
      <ConnectForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );

    const saveAndConnectButton = screen.getByText('Save & Connect');
    expect(saveAndConnectButton).to.be.visible;

    fireEvent.click(saveAndConnectButton);

    expect(screen.getByText('Save connection to favorites')).to.be.visible;

    const dialog = screen.getByRole('dialog');
    expect(dialog).to.be.visible;

    expect(getByText(dialog, 'Save & Connect')).to.be.visible;
    expect(() => getByText(dialog, 'Save')).to.throw;
  });

  it('should not show a Save & Connect button when there is an existing connection', function () {
    render(
      <ConnectForm
        onConnectClicked={noop}
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
          favorite: {
            name: 'foo',
          },
        }}
        onSaveConnectionClicked={noop}
      />
    );

    expect(() => screen.getByText('Save & Connect')).to.throw;
  });
});

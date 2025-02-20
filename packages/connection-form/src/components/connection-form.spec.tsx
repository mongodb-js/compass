import React from 'react';
import {
  render,
  screen,
  cleanup,
  fireEvent,
  waitFor,
  userEvent,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import ConnectionForm from './connection-form';
import type { ConnectionFormProps } from './connection-form';
import Sinon from 'sinon';
import { defaultConnectionString } from '../constants/default-connection';
import type { ConnectionInfo } from '@mongodb-js/connection-info';

const DEFAULT_CONNECTION: ConnectionInfo = {
  id: 'default',
  connectionOptions: {
    connectionString: defaultConnectionString,
  },
};

const noop = (): any => {
  /* no-op */
};

const saveAndConnectText = 'Save & Connect';
const favoriteText = 'FAVORITE';

describe('ConnectionForm Component', function () {
  function renderForm(props: Partial<ConnectionFormProps> = {}) {
    return render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'mongodb://pineapple:orangutans@localhost:27019',
          },
        }}
        {...props}
      />
    );
  }

  afterEach(function () {
    cleanup();
  });

  it('should show the heading', function () {
    renderForm();
    expect(screen.getByText('New Connection')).to.exist;
  });

  it('should show no save or connect buttons by default', function () {
    renderForm();
    expect(screen.queryByRole('button', { name: 'Save' })).to.be.null;
    expect(screen.queryByRole('button', { name: 'Connect' })).to.be.null;
    expect(screen.queryByRole('button', { name: 'Save & Connect' })).to.be.null;
  });

  it('should show the save button if onSaveClicked is specified', function () {
    const onSaveClicked = Sinon.spy();
    renderForm({
      onSaveClicked: onSaveClicked,
    });
    const button = screen
      .getByRole('button', { name: 'Save' })
      .closest('button');
    expect(button?.getAttribute('aria-disabled')).to.not.equal('true');

    button?.click();
    expect(onSaveClicked.callCount).to.equal(1);
  });

  it('should show the connect button if onConnectClicked is specified', function () {
    const onConnectClicked = Sinon.spy();

    renderForm({
      onConnectClicked,
    });
    const button = screen
      .getByRole('button', { name: 'Connect' })
      .closest('button');
    expect(button?.getAttribute('aria-disabled')).to.not.equal('true');

    button?.click();
    expect(onConnectClicked.callCount).to.equal(1);
  });

  it('should show the save & connect button if onSaveAndConnectClicked is specified', function () {
    const onSaveAndConnectClicked = Sinon.spy();

    renderForm({
      onSaveAndConnectClicked,
    });
    const button = screen
      .getByRole('button', { name: 'Save & Connect' })
      .closest('button');
    expect(button?.getAttribute('aria-disabled')).to.not.equal('true');

    button?.click();
    expect(onSaveAndConnectClicked.callCount).to.equal(1);
  });

  it('should render the connection string textbox', function () {
    renderForm();
    const textArea = screen.getByTestId<HTMLInputElement>('connectionString');
    expect(textArea).to.have.text('mongodb://pineapple:*****@localhost:27019/');
  });

  describe('"Edit connection string" toggle state', function () {
    let sandbox: Sinon.SinonSandbox;

    beforeEach(function () {
      sandbox = Sinon.createSandbox();
    });

    afterEach(function () {
      sandbox.restore();
    });

    context('when disableEditingConnectedConnection==true', function () {
      it('renders a banner, disables the connection string and removes advanced connection options + connect button', function () {
        const onDisconnectClicked = Sinon.spy();
        const onSaveClicked = Sinon.spy();
        const onConnectClicked = undefined;
        const onSaveAndConnectClicked = undefined;

        renderForm({
          disableEditingConnectedConnection: true,
          onDisconnectClicked,
          onSaveClicked,
          onConnectClicked,
          onSaveAndConnectClicked,
        });

        expect(
          screen.getByTestId('disabled-connected-connection-banner')
        ).to.exist;
        expect(screen.getByRole('button', { name: 'Disconnect' })).to.exist;
        expect(() =>
          screen.getByTestId('toggle-edit-connection-string')
        ).to.throw;
        expect(() =>
          screen.getByTestId('advanced-connection-options')
        ).to.throw;
        expect(() => screen.getByRole('button', { name: 'Connect' })).to.throw;
        expect(() =>
          screen.getByRole('button', { name: 'Save & Connect' })
        ).to.throw;

        // pressing enter calls onSubmit which saves
        fireEvent.submit(screen.getByRole('form'));
        expect(onSaveClicked.callCount).to.equal(1);

        fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
        expect(onDisconnectClicked.callCount).to.equal(1);
      });
    });

    context('when disableEditingConnectedConnection==false', function () {
      it('leaves the connection string, advanced connection options and connect button intact, does not render a banner', function () {
        const onDisconnectClicked = Sinon.spy();
        const onSaveClicked = Sinon.spy();
        const onConnectClicked = Sinon.spy();
        const onSaveAndConnectClicked = Sinon.spy();

        renderForm({
          disableEditingConnectedConnection: false,
          onDisconnectClicked,
          onSaveClicked,
          onConnectClicked,
          onSaveAndConnectClicked,
        });

        expect(() =>
          screen.getByTestId('disabled-connected-connection-banner')
        ).to.throw;
        expect(() =>
          screen.getByRole('button', { name: 'Disconnect' })
        ).to.throw;
        expect(screen.getByTestId('toggle-edit-connection-string')).to.exist;
        expect(screen.getByTestId('advanced-connection-options')).to.exist;
        expect(screen.getByRole('button', { name: 'Connect' })).to.exist;
        expect(screen.getByRole('button', { name: 'Save & Connect' })).to.exist;

        // pressing enter calls onSubmit which saves and connects (the default)
        fireEvent.submit(screen.getByRole('form'));
        expect(onSaveClicked.callCount).to.equal(0);
        expect(onSaveAndConnectClicked.callCount).to.equal(1);
      });
    });

    context(
      'when preferences.protectConnectionStringsForNewConnections === true',
      function () {
        context(
          'and preferences.protectConnectionStrings === false',
          function () {
            it('should render the toggle button in the off state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                protectConnectionStringsForNewConnections: true,
                protectConnectionStrings: false,
              });

              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });

            it('should render the toggle button in the off state for existing connection', function () {
              renderForm({
                protectConnectionStringsForNewConnections: true,
                protectConnectionStrings: false,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });
          }
        );

        context(
          'and preferences.protectConnectionStrings === true',
          function () {
            it('should render the toggle button in the off state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                protectConnectionStringsForNewConnections: true,
                protectConnectionStrings: true,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });

            it('should not render the toggle button for existing connection', function () {
              renderForm({
                protectConnectionStringsForNewConnections: true,
                protectConnectionStrings: true,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .be.null;
            });
          }
        );
      }
    );

    context(
      'when preferences.protectConnectionStringsForNewConnections === false',
      function () {
        context(
          'and preferences.protectConnectionStrings === false',
          function () {
            it('should render the toggle button in the on state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                protectConnectionStringsForNewConnections: false,
                protectConnectionStrings: false,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('true');
            });

            it('should render the toggle button in the off state for existing connection', function () {
              renderForm({
                protectConnectionStringsForNewConnections: false,
                protectConnectionStrings: false,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('false');
            });
          }
        );

        context(
          'and preferences.protectConnectionStrings === true',
          function () {
            it('should render the toggle button in the on state for default connection', function () {
              renderForm({
                initialConnectionInfo: DEFAULT_CONNECTION,
                protectConnectionStringsForNewConnections: false,
                protectConnectionStrings: true,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .not.be.null;
              expect(
                screen
                  .getByTestId('toggle-edit-connection-string')
                  .getAttribute('aria-checked')
              ).to.equal('true');
            });

            it('should not render the toggle button for existing connection', function () {
              renderForm({
                protectConnectionStringsForNewConnections: false,
                protectConnectionStrings: true,
              });
              expect(screen.queryByTestId('toggle-edit-connection-string')).to
                .be.null;
            });
          }
        );
      }
    );
  });

  context('protectConnectionStrings', function () {
    it('should not render the banner by default', function () {
      renderForm();
      expect(
        screen.queryByTestId('protect-connection-strings-banner')
      ).to.be.null;
    });

    it('renders a banner if protectConnectionStrings === true', function () {
      renderForm({
        protectConnectionStrings: true,
      });
      expect(screen.getByTestId('protect-connection-strings-banner')).to.exist;
    });
  });

  // TODO(COMPASS-7762)
  context.skip('when preferences.showFavoriteActions === false', function () {
    it('should not render the favorite button', function () {
      renderForm({
        showFavoriteActions: false,
      });
      expect(screen.queryByText(favoriteText)).to.not.exist;
    });
  });

  it('should render an error with an invalid connection string', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );
    expect(screen.getByText('Invalid connection string "pineapples"')).to.be
      .visible;
  });

  // TODO(COMPASS-7762)
  it.skip('should show a button to save a connection', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );
    expect(screen.getByText(favoriteText).closest('button')).to.be.visible;
  });

  // TODO(COMPASS-7762)
  it.skip('should show the saved connection modal when the favorite button is clicked', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );

    expect(screen.queryByText('Save connection to favorites')).to.not.exist;

    const button = screen.getByText(favoriteText).closest('button');
    if (button) {
      fireEvent.click(button);
    }

    expect(screen.getByText('Save connection to favorites')).to.be.visible;
  });

  it('should render a connection error', function () {
    render(
      <ConnectionForm
        connectionErrorMessage="connection error"
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'mongodb://localhost:27017',
          },
        }}
        onSaveClicked={noop}
      />
    );

    expect(screen.getByText('connection error')).to.be.visible;
  });

  // TODO(COMPASS-7762)
  it.skip('should show a Save & Connect button when there is no existing connection', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
        }}
        onSaveClicked={noop}
      />
    );

    const saveAndConnectButton = screen.getByText(saveAndConnectText);
    expect(saveAndConnectButton).to.be.visible;

    fireEvent.click(saveAndConnectButton);

    expect(screen.getByText('Save connection to favorites')).to.be.visible;

    const dialog = screen.getByRole('dialog');
    expect(dialog).to.be.visible;

    expect(within(dialog).getByText(saveAndConnectText)).to.be.visible;
    expect(() => within(dialog).getByText('Save')).to.throw();
  });

  it('should not show a Save & Connect button when there is an existing connection', function () {
    render(
      <ConnectionForm
        initialConnectionInfo={{
          id: 'test',
          connectionOptions: {
            connectionString: 'pineapples',
          },
          favorite: {
            name: 'foo',
          },
        }}
        onSaveClicked={noop}
      />
    );

    expect(() => screen.getByText(saveAndConnectText)).to.throw;
  });

  it('should not include the help panels', function () {
    expect(screen.queryByText(/How do I find my/)).to.be.null;
    expect(screen.queryByText(/How do I format my/)).to.be.null;
  });

  context('with default connection', function () {
    let onCancel: Sinon.SinonSpy;
    beforeEach(function () {
      onCancel = Sinon.spy();

      renderForm({
        initialConnectionInfo: DEFAULT_CONNECTION,
        protectConnectionStringsForNewConnections: false,
        protectConnectionStrings: false,
        onCancel,
      });
    });

    it('should not show the old favorite button', function () {
      expect(screen.queryByTestId('edit-favorite-icon-button')).to.be.null;
    });

    it('should include the help panels', function () {
      expect(screen.getByText(/How do I find my/)).to.be.visible;
      expect(screen.getByText(/How do I format my/)).to.be.visible;
    });

    it('should show a Cancel button', function () {
      const button = screen.queryByRole('button', { name: 'Cancel' });

      expect(button).to.be.visible;

      button?.click();

      expect(onCancel).to.have.been.called;
    });

    describe('name input', function () {
      it('should sync with the href of the connection string unless it has been edited', async function () {
        const connectionString =
          screen.getByTestId<HTMLInputElement>('connectionString');
        userEvent.clear(connectionString);

        await waitFor(() => expect(connectionString.value).to.equal(''));

        userEvent.paste(connectionString, 'mongodb://myserver:27017/');

        await waitFor(() =>
          expect(connectionString.value).to.equal('mongodb://myserver:27017/')
        );

        const personalizationName = screen.getByTestId<HTMLInputElement>(
          'personalization-name-input'
        );
        expect(personalizationName.value).to.equal('myserver:27017');
      });

      it('should not sync with the href of the connection string when it has been edited', async function () {
        const connectionString =
          screen.getByTestId<HTMLInputElement>('connectionString');
        const personalizationName = screen.getByTestId<HTMLInputElement>(
          'personalization-name-input'
        );

        userEvent.clear(personalizationName);
        userEvent.clear(connectionString);

        await waitFor(() => {
          expect(personalizationName.value).to.equal('');
          expect(connectionString.value).to.equal('');
        });

        userEvent.paste(personalizationName, 'my happy name');

        await waitFor(() =>
          expect(personalizationName.value).to.equal('my happy name')
        );

        userEvent.paste(connectionString, 'mongodb://webscale:27017/');

        await waitFor(() =>
          expect(connectionString.value).to.equal('mongodb://webscale:27017/')
        );

        expect(personalizationName.value).to.equal('my happy name');
      });
    });
  });
});

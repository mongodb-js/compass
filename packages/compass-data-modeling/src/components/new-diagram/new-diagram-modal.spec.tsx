import React from 'react';
import { expect } from 'chai';
import {
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import NewDiagramModal from './new-diagram-modal';
import { createNewDiagram } from '../../store/generate-diagram-wizard';
import { renderWithStore } from '../../../test/setup-store';
import type { DataModelingStore } from '../../../test/setup-store';
import { openDiagramFromFile } from '../../store/diagram';
import FlightDiagram from '../../../test/fixtures/data-model-with-relationships.json';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';

function getComboboxByTestId(testId: string) {
  return within(screen.getByTestId(testId)).getByRole('combobox');
}

async function setSetupDiagramStep(
  store: DataModelingStore,
  {
    connection,
    databaseName,
    diagramName,
  }: {
    connection?: {
      id: string;
      name: string;
    };
    databaseName?: string;
    diagramName?: string;
  }
) {
  store.dispatch(createNewDiagram());

  if (connection) {
    userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
    userEvent.click(screen.getByText(connection.name));
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.selectedConnection
          .value
      ).to.equal(connection.id);
    });
  }

  if (databaseName) {
    userEvent.click(getComboboxByTestId('new-diagram-database-selector'));
    userEvent.click(screen.getByText(databaseName));
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.selectedDatabase.value
      ).to.equal(databaseName);
    });
  }

  if (diagramName) {
    // Clear the name because we auto-generate it when selecting DB
    userEvent.clear(screen.getByTestId('new-diagram-name-input'));
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.diagramName.value
      ).to.equal('');
    });
    userEvent.paste(screen.getByTestId('new-diagram-name-input'), diagramName);
    await waitFor(() => {
      expect(
        store.getState().generateDiagramWizard.formFields.diagramName.value
      ).to.equal(diagramName);
    });
  }
}

describe('NewDiagramModal', function () {
  context('setup-diagram step', function () {
    context('enter-name', function () {
      let store: DataModelingStore;
      let modal: HTMLElement;
      beforeEach(() => {
        const { store: setupStore } = renderWithStore(<NewDiagramModal />);
        store = setupStore;
        store.dispatch(createNewDiagram());
        modal = screen.getByTestId('new-diagram-modal');
        expect(modal).to.be.visible;
      });
      it('allows user to enter name for the model', async function () {
        userEvent.type(
          within(modal).getByTestId('new-diagram-name-input'),
          'diagram-1'
        );
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.equal('diagram-1');
        });
      });

      it('keeps next button disabled if diagram name is empty', async function () {
        userEvent.clear(within(modal).getByTestId('new-diagram-name-input'));
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.be.undefined;
        });
        const button = within(modal).getByRole('button', {
          name: /next/i,
        });
        expect(button.getAttribute('aria-disabled')).to.equal('true');
      });

      it('cancels process when cancel is clicked', function () {
        userEvent.click(
          within(modal).getByRole('button', {
            name: /cancel/i,
          })
        );
        expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      });

      it('show error if diagram name already exists', async function () {
        const blob = new Blob(
          [
            JSON.stringify({
              version: 1,
              type: 'Compass Data Modeling Diagram',
              name: 'Test Diagram',
              database: 'test-database',
              edits: Buffer.from(JSON.stringify(FlightDiagram.edits)).toString(
                'base64'
              ),
            }),
          ],
          { type: 'application/json' }
        );
        const file = new File([blob], 'diagram.json', {
          type: 'application/json',
        });
        await store.dispatch(openDiagramFromFile(file));

        userEvent.type(
          within(modal).getByTestId('new-diagram-name-input'),
          'Test Diagram'
        );
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.equal('Test Diagram');
        });
        const button = within(modal).getByRole('button', {
          name: /next/i,
        });
        expect(button.getAttribute('aria-disabled')).to.equal('true');
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.error
              ?.message
          ).to.equal('Diagram with this name already exists.');
        });
        const errorMessage = within(modal).getByText(
          /Diagram with this name already exists./i
        );
        expect(errorMessage).to.exist;
      });
    });

    context('select-connection', function () {
      it('shows error if there are no connections', function () {
        const { store } = renderWithStore(<NewDiagramModal />, {
          connections: [],
        });
        store.dispatch(createNewDiagram());
        expect(
          screen.queryByText(
            /You do not have any connections, create a new connection first./
          )
        ).to.exist;
      });

      it('shows list of connections and allows user to select one', function () {
        const { store } = renderWithStore(<NewDiagramModal />);
        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        expect(screen.getByText('Conn1')).to.exist;
        expect(screen.getByText('Conn2')).to.exist;

        userEvent.click(screen.getByText('Conn2'));
        expect(
          store.getState().generateDiagramWizard.formFields.selectedConnection
            .value
        ).to.eq('two');
      });

      it('shows error if it fails to connect', function () {
        const { store } = renderWithStore(<NewDiagramModal />, {
          services: {
            connections: {
              connect() {
                throw new Error('Can not connect');
              },
              getConnectionById(id: string) {
                return {
                  info: { id },
                };
              },
            } as any,
          },
        });

        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));

        expect(screen.queryByText(/Connection failed./)).to.exist;
      });
    });

    context('select-database', function () {
      it('shows list of databases and allows user to select one', async function () {
        const { store } = renderWithStore(<NewDiagramModal />);

        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.selectedConnection
              .value
          ).to.equal('two');
        });

        userEvent.click(getComboboxByTestId('new-diagram-database-selector'));

        expect(screen.getByText('berlin')).to.exist;
        expect(screen.getByText('sample_airbnb')).to.exist;

        userEvent.click(screen.getByText('sample_airbnb'));
        expect(
          store.getState().generateDiagramWizard.formFields.selectedDatabase
            .value
        ).to.eq('sample_airbnb');
      });

      it('auto generates the name of a diagram', async function () {
        const { store } = renderWithStore(<NewDiagramModal />);
        await setSetupDiagramStep(store, {
          connection: { id: 'two', name: 'Conn2' },
          databaseName: 'sample_airbnb',
        });
        await waitFor(() => {
          // Not testing for exact date, but format
          expect(
            store.getState().generateDiagramWizard.formFields.diagramName.value
          ).to.match(/^sample_airbnb_\d{2}_\d{2}_\d{4}$/);
        });
      });

      it('shows error if it fails to fetch list of databases', async function () {
        const { store } = renderWithStore(<NewDiagramModal />, {
          services: {
            connections: {
              connect() {
                return Promise.resolve();
              },
              getConnectionById(id: string) {
                return {
                  info: { id },
                };
              },
              getDataServiceForConnection() {
                return {
                  listDatabases() {
                    throw new Error('Can not list databases');
                  },
                };
              },
            } as any,
          },
        });

        store.dispatch(createNewDiagram());

        userEvent.click(getComboboxByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));

        await waitFor(() => {
          expect(
            store.getState().generateDiagramWizard.formFields.selectedDatabase
              .error?.message
          ).to.equal('Can not list databases');
        });
        expect(screen.getByText(/Can not list databases/)).to.exist;
      });
    });

    it('allows to proceed to the next step if all fields are valid and have no errors', async function () {
      const { store } = renderWithStore(<NewDiagramModal />);

      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.step).to.equal(
          'SELECT_COLLECTIONS'
        );
      });
    });
  });

  context('select-collections step', function () {
    it('shows list of collections', async function () {
      const preferences = await createSandboxFromDefaultPreferences();
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          preferences,
        },
      });
      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_COLLECTIONS'
      );
      expect(
        store.getState().generateDiagramWizard.formFields.selectedCollections
          .value
      ).to.deep.equal(['listings', 'listingsAndReviews', 'reviews']);

      expect(screen.getByText('listings')).to.exist;
      expect(screen.getByText('listingsAndReviews')).to.exist;
      expect(screen.getByText('reviews')).to.exist;

      userEvent.click(
        screen.getByRole('button', {
          name: /generate/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      });
    });

    it('shows error if it fails to fetch list of collections', async function () {
      const { store } = renderWithStore(<NewDiagramModal />, {
        services: {
          connections: {
            connect() {
              return Promise.resolve();
            },
            getConnectionById(id: string) {
              return {
                info: { id },
              };
            },
            getDataServiceForConnection() {
              return {
                listDatabases() {
                  return [
                    {
                      _id: 'sample_airbnb',
                      name: 'sample_airbnb',
                    },
                  ];
                },
                listCollections() {
                  throw new Error('Can not list collections');
                },
              };
            },
          } as any,
        },
      });

      await setSetupDiagramStep(store, {
        connection: { id: 'two', name: 'Conn2' },
        databaseName: 'sample_airbnb',
        diagramName: 'diagram1',
      });

      // Next to trigger loading collections
      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(
        store.getState().generateDiagramWizard.formFields.selectedCollections
          .error?.message
      ).to.equal('Can not list collections');
    });
  });
});

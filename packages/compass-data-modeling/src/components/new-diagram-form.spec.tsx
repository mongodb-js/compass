import React from 'react';
import { expect } from 'chai';
import {
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import DiagramForm from './new-diagram-form';
import { changeName, createNewDiagram } from '../store/generate-diagram-wizard';
import { renderWithStore } from '../../tests/setup-store';
import type { DataModelingStore } from '../../tests/setup-store';

describe('NewDiagramForm', function () {
  context('enter-name step', function () {
    let store: DataModelingStore;
    let modal: HTMLElement;

    beforeEach(async () => {
      const { store: setupStore } = await renderWithStore(<DiagramForm />);
      store = setupStore;
      store.dispatch(createNewDiagram());
      modal = screen.getByTestId('new-diagram-modal');
      expect(modal).to.be.visible;
    });

    it('allows user to enter name for the model', function () {
      userEvent.type(
        within(modal).getByTestId('new-diagram-name-input'),
        'diagram-1'
      );
      expect(store.getState().generateDiagramWizard.diagramName).to.equal(
        'diagram-1'
      );
    });

    it('keeps next button disabled if diagram name is empty', function () {
      userEvent.clear(within(modal).getByTestId('new-diagram-name-input'));
      expect(store.getState().generateDiagramWizard.diagramName).to.equal('');
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
  });

  context('select-connection step', function () {
    it('shows warning if there are no connections', async function () {
      const { store } = await renderWithStore(<DiagramForm />, {
        connections: [],
      });
      store.dispatch(createNewDiagram());

      store.dispatch(changeName('diagram1'));
      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      const alert = screen.getByRole('alert');
      expect(alert.textContent).to.contain(
        'You do not have any connections, create a new connection first'
      );
    });

    it('shows list of connections and allows user to select one', async function () {
      const { store } = await renderWithStore(<DiagramForm />);

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
      expect(screen.getByText('Conn1')).to.exist;
      expect(screen.getByText('Conn2')).to.exist;

      userEvent.click(screen.getByText('Conn2'));
      expect(store.getState().generateDiagramWizard.selectedConnectionId).to.eq(
        'two'
      );

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'CONNECTING'
      );
      await waitFor(() => {
        expect(
          store.getState().generateDiagramWizard.connectionDatabases
        ).to.deep.equal(['berlin', 'sample_airbnb']);
      });

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_DATABASE'
      );
    });

    // TODO
    it.skip('shows error if it fails to connect');
  });

  context('select-database step', function () {
    it('shows list of databases and allows user to select one', async function () {
      const { store } = await renderWithStore(<DiagramForm />);

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      {
        // Navigate to select db
        userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_DATABASE'
          );
        });
      }

      userEvent.click(screen.getByTestId('new-diagram-database-selector'));
      expect(screen.getByText('berlin')).to.exist;
      expect(screen.getByText('sample_airbnb')).to.exist;

      userEvent.click(screen.getByText('sample_airbnb'));
      expect(store.getState().generateDiagramWizard.selectedDatabase).to.eq(
        'sample_airbnb'
      );

      userEvent.click(
        screen.getByRole('button', {
          name: /next/i,
        })
      );

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'LOADING_COLLECTIONS'
      );
      await waitFor(() => {
        expect(
          store.getState().generateDiagramWizard.selectedCollections
        ).to.deep.equal(['listings', 'listingsAndReviews', 'reviews']);
      });

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_COLLECTIONS'
      );
    });
    // TODO
    it.skip('shows error if it fails to fetch list of databases');
  });

  context('select-collections step', function () {
    it('shows list of collections', async function () {
      const { store } = await renderWithStore(<DiagramForm />);

      {
        // Navigate to connections step
        store.dispatch(createNewDiagram());
        store.dispatch(changeName('diagram1'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
      }

      {
        // Navigate to select db
        userEvent.click(screen.getByTestId('new-diagram-connection-selector'));
        userEvent.click(screen.getByText('Conn2'));
        userEvent.click(
          screen.getByRole('button', {
            name: /next/i,
          })
        );
        await waitFor(() => {
          expect(store.getState().generateDiagramWizard.step).to.equal(
            'SELECT_DATABASE'
          );
        });
      }

      {
        // Navigate to select colls
        userEvent.click(screen.getByTestId('new-diagram-database-selector'));
        userEvent.click(screen.getByText('sample_airbnb'));
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
      }

      expect(screen.getByText('listings')).to.exist;
      expect(screen.getByText('listingsAndReviews')).to.exist;
      expect(screen.getByText('reviews')).to.exist;

      expect(store.getState().generateDiagramWizard.step).to.equal(
        'SELECT_COLLECTIONS'
      );
      expect(
        store.getState().generateDiagramWizard.selectedCollections
      ).to.deep.equal(['listings', 'listingsAndReviews', 'reviews']);

      userEvent.click(
        screen.getByRole('button', {
          name: /generate/i,
        })
      );

      await waitFor(() => {
        expect(store.getState().generateDiagramWizard.inProgress).to.be.false;
      });
    });
    // TODO
    it.skip('shows error if it fails to fetch list of collections');
  });
});

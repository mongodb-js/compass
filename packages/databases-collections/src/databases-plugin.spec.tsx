import React from 'react';
import { MongoDBInstance } from 'mongodb-instance-model';
import type { RenderWithConnectionsResult } from '@mongodb-js/testing-library-compass';
import {
  render,
  screen,
  cleanup,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { DatabasesWorkspaceTab } from './';
import Sinon from 'sinon';
import {
  createSandboxFromDefaultPreferences,
  type PreferencesAccess,
} from 'compass-preferences-model';

describe('Databasees [Plugin]', function () {
  let dataService: any;
  let mongodbInstance: Sinon.SinonSpiedInstance<MongoDBInstance>;
  let preferences: PreferencesAccess;
  let appRegistry: Sinon.SinonSpiedInstance<
    RenderWithConnectionsResult['globalAppRegistry']
  >;

  afterEach(function () {
    mongodbInstance.removeAllListeners();
    cleanup();
  });

  describe('with loaded databases', function () {
    before(() => {
      process.env.COMPASS_DISABLE_VIRTUAL_SCROLLING = 'true';
    });

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      mongodbInstance = Sinon.spy(
        new MongoDBInstance({
          databases: [],
          topologyDescription: { type: 'ReplicaSetWithPrimary' },
          preferences,
        } as any)
      );

      dataService = {
        listDatabases() {
          return Promise.resolve([
            { _id: 'foo', name: 'foo' },
            { _id: 'bar', name: 'bar' },
          ]);
        },
      };

      const Plugin = DatabasesWorkspaceTab.provider.withMockServices({
        instance: mongodbInstance,
        dataService,
      });

      const { globalAppRegistry } = render(
        <Plugin>
          <DatabasesWorkspaceTab.content />
        </Plugin>
      );

      appRegistry = Sinon.spy(globalAppRegistry);

      await waitFor(() => {
        expect(screen.getByTestId('databases-list-row-foo')).to.exist;
        expect(screen.getByTestId('databases-list-row-bar')).to.exist;
      });
    });

    it('renders a list of databases', function () {
      const list = screen.getByTestId('databases-list');
      expect(
        list.querySelectorAll('[data-lgid="lg-table-row"]')
      ).to.have.lengthOf(2);
    });

    it('initiates action to create a database', function () {
      userEvent.click(screen.getByRole('button', { name: /Create database/ }));
      expect(appRegistry.emit).to.have.been.calledWith(
        'open-create-database',
        // this event is supposed to emit always with a connectionId and this
        // connection id is the default provided by the connectionInfoProvider
        { connectionId: 'TEST' }
      );
    });

    it('initiates action to refresh databases', function () {
      userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
      expect(appRegistry.emit).to.have.been.calledWith('refresh-databases');
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mongodbInstance.fetchDatabases).to.have.been.called;
    });

    it('initiates action to delete a database', function () {
      const row = screen.getByTestId('databases-list-row-foo');
      userEvent.hover(row);
      userEvent.click(
        row.querySelector('[aria-label="Delete foo"]') as Element
      );
      expect(appRegistry.emit).to.have.been.calledWith(
        'open-drop-database',
        'foo',
        // this event is supposed to emit always with a connectionId and this
        // connection id is the default provided by the connectionInfoProvider
        { connectionId: 'TEST' }
      );
    });

    it('updates when instance model updates', async function () {
      (mongodbInstance as any).set({
        databases: [{ _id: 'testdb', name: 'testdb' }],
      });

      await waitFor(() => {
        expect(screen.queryByTestId('databases-list-row-foo')).to.not.exist;
        expect(screen.getByTestId('databases-list-row-testdb')).to.exist;
      });

      expect(screen.getByRole('button', { name: /Create database/ })).to.exist;

      (mongodbInstance as any).set({
        topologyDescription: { type: 'Unknown' },
      });

      expect(screen.queryByRole('button', { name: /Create database/ })).to.not
        .exist;
    });
  });
});

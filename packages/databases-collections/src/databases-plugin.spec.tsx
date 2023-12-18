import React from 'react';
import { MongoDBInstance } from 'mongodb-instance-model';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { DatabasesPlugin } from './databases-plugin';
import AppRegistry from 'hadron-app-registry';
import Sinon from 'sinon';

describe('Databasees [Plugin]', function () {
  let dataService: any;
  let mongodbInstance: MongoDBInstance;
  let appRegistry: Sinon.SinonSpiedInstance<AppRegistry>;

  beforeEach(function () {
    appRegistry = Sinon.spy(new AppRegistry());
  });

  afterEach(function () {
    mongodbInstance.removeAllListeners();
    cleanup();
  });

  describe('with loaded databases', function () {
    beforeEach(async function () {
      mongodbInstance = new MongoDBInstance({
        databases: [],
        topologyDescription: { type: 'ReplicaSetWithPrimary' },
      } as any);

      dataService = {
        listDatabases() {
          return Promise.resolve([
            { _id: 'foo', name: 'foo' },
            { _id: 'bar', name: 'bar' },
          ]);
        },
      };

      const Plugin = DatabasesPlugin.withMockServices({
        instance: mongodbInstance,
        globalAppRegistry: appRegistry,
        dataService,
      });

      render(<Plugin></Plugin>);

      await waitFor(() => {
        expect(screen.getByRole('gridcell', { name: /foo/ })).to.exist;
        expect(screen.getByRole('gridcell', { name: /bar/ })).to.exist;
      });
    });

    it('renders a list of databases', function () {
      userEvent.click(screen.getByRole('button', { name: /Create database/ }));
      expect(appRegistry.emit).to.have.been.calledWith('open-create-database');

      userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
      expect(appRegistry.emit).to.have.been.calledWith('refresh-databases');

      userEvent.hover(screen.getByRole('gridcell', { name: /foo/ }));
      userEvent.click(screen.getByRole('button', { name: /Delete/ }));
      expect(appRegistry.emit).to.have.been.calledWith('refresh-databases');
    });

    it('updates when instance model updates', async function () {
      (mongodbInstance as any).set({
        databases: [{ _id: 'testdb', name: 'testdb' }],
      });

      await waitFor(() => {
        expect(screen.queryByRole('gridcell', { name: /foo/ })).to.not.exist;
        expect(screen.getByRole('gridcell', { name: /testdb/ })).to.exist;
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

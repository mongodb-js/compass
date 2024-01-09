import React from 'react';
import { MongoDBInstance } from 'mongodb-instance-model';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { CollectionsPlugin } from './collections-plugin';
import AppRegistry from 'hadron-app-registry';
import Sinon from 'sinon';

describe('Collections [Plugin]', function () {
  let dataService: any;
  let mongodbInstance: Sinon.SinonSpiedInstance<MongoDBInstance>;
  let appRegistry: Sinon.SinonSpiedInstance<AppRegistry>;

  beforeEach(function () {
    appRegistry = Sinon.spy(new AppRegistry());
    mongodbInstance = Sinon.spy(
      new MongoDBInstance({
        databases: [
          {
            _id: 'foo',
            name: 'foo',
            collections: [],
          },
        ],
        topologyDescription: { type: 'ReplicaSetWithPrimary' },
      } as any)
    );
    for (const db of mongodbInstance.databases) {
      Sinon.spy(db);
    }

    dataService = {
      listCollections() {
        return Promise.resolve([
          { _id: 'foo.bar', name: 'bar' },
          { _id: 'foo.buz', name: 'buz' },
        ]);
      },
    };
  });

  afterEach(function () {
    mongodbInstance.removeAllListeners();
    Sinon.resetHistory();
    cleanup();
  });

  describe('with loaded collections', function () {
    beforeEach(async function () {
      const Plugin = CollectionsPlugin.withMockServices({
        instance: mongodbInstance,
        globalAppRegistry: appRegistry,
        dataService,
      });

      render(<Plugin namespace="foo"></Plugin>);

      await waitFor(() => {
        expect(screen.getByRole('gridcell', { name: /bar/ })).to.exist;
        expect(screen.getByRole('gridcell', { name: /buz/ })).to.exist;
      });
    });

    it('renders a list of collections', function () {
      userEvent.click(
        screen.getByRole('button', { name: /Create collection/ })
      );
      expect(appRegistry.emit).to.have.been.calledWithMatch(
        'open-create-collection',
        { ns: 'foo' }
      );

      userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mongodbInstance.databases.get('foo')?.fetchCollectionsDetails).to
        .have.been.called;

      userEvent.hover(screen.getByRole('gridcell', { name: /bar/ }));
      userEvent.click(screen.getByRole('button', { name: /Delete/ }));
      expect(appRegistry.emit).to.have.been.calledWithMatch(
        'open-drop-collection',
        { ns: 'foo.bar' }
      );
    });

    it('updates when instance model updates', async function () {
      (mongodbInstance.databases.get('foo') as any).set({
        collections: [{ _id: 'foo.testdb', name: 'testdb' }],
      });

      await waitFor(() => {
        expect(screen.queryByRole('gridcell', { name: /bar/ })).to.not.exist;
        expect(screen.getByRole('gridcell', { name: /testdb/ })).to.exist;
      });

      expect(screen.getByRole('button', { name: /Create collection/ })).to
        .exist;

      (mongodbInstance as any).set({
        topologyDescription: { type: 'Unknown' },
      });

      expect(screen.queryByRole('button', { name: /Create collection/ })).to.not
        .exist;
    });
  });
});

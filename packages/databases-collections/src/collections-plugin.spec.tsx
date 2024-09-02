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
import { CollectionsPlugin } from './collections-plugin';
import Sinon from 'sinon';

describe('Collections [Plugin]', function () {
  let dataService: any;
  let mongodbInstance: Sinon.SinonSpiedInstance<MongoDBInstance>;
  let appRegistry: Sinon.SinonSpiedInstance<
    RenderWithConnectionsResult['globalAppRegistry']
  >;

  beforeEach(function () {
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
        database: mongodbInstance.databases.get('foo'),
        dataService,
      });

      const { globalAppRegistry } = render(<Plugin namespace="foo"></Plugin>);
      appRegistry = Sinon.spy(globalAppRegistry);

      await waitFor(() => {
        expect(screen.getByRole('gridcell', { name: /bar/ })).to.exist;
        expect(screen.getByRole('gridcell', { name: /buz/ })).to.exist;
      });
    });

    it('renders a list of collections', function () {
      expect(screen.getAllByRole('gridcell')).to.have.lengthOf(2);
    });

    it.only('initiates action to create a collection', function () {
      userEvent.click(
        screen.getByRole('button', { name: /Create collection/ })
      );
      expect(appRegistry.emit).to.have.been.calledWithMatch(
        'open-create-collection',
        { ns: 'foo' },
        // this event is supposed to emit always with a connectionId and this
        // connection id is the default provided by the connectionInfoProvider
        { connectionId: 'TEST' }
      );

      expect(screen.getByText('Create Collection')).to.be.visible;
    });

    it('initiates action to refresh collections', function () {
      userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mongodbInstance.databases.get('foo')?.fetchCollectionsDetails).to
        .have.been.called;
    });

    it('initiates action to drop a collection', function () {
      userEvent.hover(screen.getByRole('gridcell', { name: /bar/ }));
      userEvent.click(screen.getByRole('button', { name: /Delete/ }));
      expect(appRegistry.emit).to.have.been.calledWithMatch(
        'open-drop-collection',
        { ns: 'foo.bar' },
        // this event is supposed to emit always with a connectionId and this
        // connection id is the default provided by the connectionInfoProvider
        { connectionId: 'TEST' }
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

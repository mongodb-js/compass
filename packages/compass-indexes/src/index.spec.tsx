import React from 'react';
import Sinon from 'sinon';
import {
  CompassIndexesPlugin as CompassIndexesSubtab,
  CompassIndexesPluginProvider,
} from './index';
import {
  createDefaultConnectionInfo,
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
  within,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import {
  indexCreationStarted,
  prepareInProgressIndex,
  rollingIndexTimeoutCheck,
} from './modules/regular-indexes';

describe('CompassIndexesPlugin', function () {
  const sandbox = Sinon.createSandbox();

  const dataService = {
    indexes: () => [],
    createIndex: () => ({}),
  };

  const atlasService = {
    automationAgentRequest: () => ({}),
    automationAgentAwait: () => ({ response: [] }),
    authenticatedFetch: () => undefined,
    cloudEndpoint: () => undefined,
  };

  const renderHelpers = createPluginTestHelpers(
    CompassIndexesPluginProvider.withMockServices({
      dataService,
      atlasService,
      instance: {
        on: () => undefined,
        removeListener: () => undefined,
        isWritable: true,
      },
      collection: {
        on: () => undefined,
        removeListener: () => undefined,
        toJSON: () => ({}),
      },
    } as any)
  );

  function render() {
    return renderHelpers.renderWithActiveConnection(
      <CompassIndexesSubtab.content></CompassIndexesSubtab.content>,
      {
        ...createDefaultConnectionInfo(),
        atlasMetadata: {
          instanceSize: 'VERY BIG',
          metricsType: 'replicaSet',
          supports: {
            rollingIndexes: true,
          },
        } as any,
      },
      {
        preferences: {
          enableRollingIndexes: true,
        },
      }
    );
  }

  afterEach(function () {
    sandbox.reset();
  });

  describe('rolling indexes', function () {
    it('should create a rolling index and show it in the table', async function () {
      const result = await render();

      await waitFor(() => {
        expect(result.plugin.store.getState().regularIndexes).to.have.property(
          'status',
          'READY'
        );
      });

      let resolveAgentAwait: (value: unknown) => void = () => {};
      sandbox.stub(atlasService, 'automationAgentAwait').returns(
        new Promise((resolve) => {
          resolveAgentAwait = resolve;
        }) as any
      );

      /** Create rolling index */

      userEvent.click(screen.getByRole('button', { name: 'Create Index' }));

      userEvent.type(screen.getByLabelText('Index fields'), 'field_a');
      userEvent.click(screen.getByRole('option', { name: 'Field: "field_a"' }));

      userEvent.click(screen.getByText('Select a type'));
      userEvent.click(screen.getByText('1 (asc)'));

      userEvent.click(screen.getByTestId('create-index-modal-toggle-options'));

      userEvent.click(
        screen.getByRole('checkbox', { name: 'Build in rolling process' }),
        undefined,
        { skipPointerEventsCheck: true }
      );

      userEvent.click(
        within(screen.getByTestId('create-index-modal')).getByRole('button', {
          name: 'Create Index',
        })
      );

      await waitFor(() => {
        expect(
          result.plugin.store.getState().regularIndexes.inProgressIndexes[0]
        ).to.exist;
      });
      const inProgressIndex =
        result.plugin.store.getState().regularIndexes.inProgressIndexes[0];

      /** Wait for the row to appear with creating badge first */

      expect(
        within(await screen.findByTestId('indexes-row-field_a_1')).getByText(
          'Creating'
        )
      ).to.exist;

      /** Now wait for the rolling index to show up */

      resolveAgentAwait({
        response: [
          {
            status: 'rolling build',
            indexName: 'field_a_1',
            indexProperties: {},
            indexType: { label: 'regular' },
            keys: [{ name: 'field_a', value: '1' }],
          },
        ],
      });

      await waitFor(() => {
        expect(
          within(screen.getByTestId('indexes-row-field_a_1')).getByText(
            'Building'
          )
        ).to.exist;
      });

      /** At some point rolling index timeout check fires, but nothing changes */

      result.plugin.store.dispatch(
        rollingIndexTimeoutCheck(inProgressIndex.id)
      );

      expect(
        within(screen.getByTestId('indexes-row-field_a_1')).getByText(
          'Building'
        )
      ).to.exist;
    });
  });

  it('should remove in progress rolling index on a timeout', async function () {
    const result = await render();

    await waitFor(() => {
      expect(result.plugin.store.getState().regularIndexes).to.have.property(
        'status',
        'READY'
      );
    });

    /** This time let's just do all the setup with actions directly, we tested UI above */

    const inProgressIndex = prepareInProgressIndex('test', {
      name: 'test_index',
      spec: {},
    });

    result.plugin.store.dispatch(indexCreationStarted(inProgressIndex));

    await waitFor(() => {
      expect(screen.getByTestId('indexes-row-test_index')).to.exist;
    });

    /** Timeout check "fired" before index was returned from the API, index is removed */

    result.plugin.store.dispatch(rollingIndexTimeoutCheck('test'));

    await waitFor(() => {
      expect(screen.queryByTestId('indexes-row-test_index')).to.not.exist;
    });
  });
});

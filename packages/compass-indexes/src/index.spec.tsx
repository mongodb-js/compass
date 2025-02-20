import React from 'react';
import Sinon from 'sinon';
import {
  CompassIndexesPlugin as CompassIndexesSubtab,
  CompassIndexesHadronPlugin,
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
    CompassIndexesHadronPlugin.withMockServices({
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

      sandbox.stub(atlasService, 'automationAgentAwait').resolves({
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

      const inProgressIndex =
        result.plugin.store.getState().regularIndexes.inProgressIndexes[0];

      expect(inProgressIndex).to.exist;

      /** Wait for the row to appear with in-progress bagde first */

      expect(
        within(screen.getByTestId('indexes-row-field_a_1')).getByText(
          'In Progress'
        )
      ).to.exist;

      /** Now wait for the rolling index to show up */

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

    expect(screen.getByTestId('indexes-row-test_index')).to.exist;

    /** Timeout check "fired" before index was returned from the API, index is removed */

    result.plugin.store.dispatch(rollingIndexTimeoutCheck('test'));

    expect(() => screen.getByTestId('indexes-row-test_index')).to.throw();
  });
});

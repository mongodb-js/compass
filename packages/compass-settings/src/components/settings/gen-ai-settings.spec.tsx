import React from 'react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { cleanup, render, screen, within } from '@testing-library/react';

import { GenAISettings } from './gen-ai-settings';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';

function renderGenAISettings(
  store,
  props: Partial<React.ComponentProps<typeof GenAISettings>> = {}
) {
  const component = () => (
    <Provider store={store}>
      <GenAISettings {...props} />
    </Provider>
  );
  render(component());
  return screen.getByTestId('gen-ai-settings');
}

describe('GenAISettings', function () {
  let container: HTMLElement;
  let store: ReturnType<typeof configureStore>;

  beforeEach(async function () {
    store = configureStore();
    await store.dispatch(fetchSettings());
  });

  afterEach(function () {
    cleanup();
  });

  it('does not render enableGenAIFeatures when isAIFeatureRolledOutToUser is false', function () {
    container = renderGenAISettings(store, {
      isAIFeatureRolledOutToUser: false,
    });
    expect(within(container).queryByTestId('enableGenAIFeatures')).to.not.exist;
  });

  it('renders enableGenAIFeatures when GisAIFeatureRolledOutToUser is true', function () {
    container = renderGenAISettings(store, {
      isAIFeatureRolledOutToUser: true,
    });
    expect(within(container).getByTestId('enableGenAIFeatures')).to.be.visible;
  });
});

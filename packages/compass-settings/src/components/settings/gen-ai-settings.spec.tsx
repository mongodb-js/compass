import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import { GenAISettings } from './gen-ai-settings';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';

function renderGenAiSettings({
  store = configureStore(),
  props,
}: {
  store: ReturnType<typeof configureStore>;
  props?: Partial<React.ComponentProps<typeof GenAISettings>>;
}) {
  return render(
    <Provider store={store}>
      <GenAISettings isAIFeatureEnabled {...props} />
    </Provider>
  );
}

const sampleDocsSettingText =
  'Enable sending sample field values with query and aggregation generation requests';
const atlasLoginSettingText = 'You must log in with an Atlas account to use ';

describe('GenAISettings', function () {
  let container: HTMLElement;
  let store: ReturnType<typeof configureStore>;

  describe('when the isAIFeatureEnabled prop is false', function () {
    beforeEach(async function () {
      store = configureStore();
      await store.dispatch(fetchSettings());
      renderGenAiSettings({
        store,
        props: {
          isAIFeatureEnabled: false,
        },
      });
      container = screen.getByTestId('gen-ai-settings');
    });

    it('does not show the atlas login setting', function () {
      expect(container).to.not.include.text(atlasLoginSettingText);
    });
  });

  describe('when the isAIFeatureEnabled setting is true', function () {
    beforeEach(async function () {
      store = configureStore();
      await store.dispatch(fetchSettings());
      renderGenAiSettings({
        store,
      });
      container = screen.getByTestId('gen-ai-settings');
    });

    it('shows the atlas login setting', function () {
      expect(container).to.include.text(atlasLoginSettingText);
    });

    it('shows the enableGenAISampleDocumentPassing setting', function () {
      expect(container).to.include.text(sampleDocsSettingText);
    });
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from './stores/store';
import Aggregations from './plugin';

const renderWithFeatureFlagValue = ({ toolbarEnabled, exportButtonEnabled }: { toolbarEnabled: string, exportButtonEnabled: string }) => {
  process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = toolbarEnabled;
  process.env.COMPASS_ENABLE_AGGREGATION_EXPORT = exportButtonEnabled;
  const store = configureStore({});
  render(<Aggregations store={store} />);
};

describe('Aggregations [Plugin]', function () {
  it('renders new toolbar when feature flag is enabled', function () {
    renderWithFeatureFlagValue({ toolbarEnabled: 'true', exportButtonEnabled: 'false' });
    expect(screen.getByTestId('pipeline-toolbar')).to.exist;
  });

  it('renders legacy toolbar when feature flag is not enabled', function () {
    renderWithFeatureFlagValue({ toolbarEnabled: 'false', exportButtonEnabled: 'false' });
    expect(screen.getByTestId('legacy-pipeline-toolbar')).to.exist;
  });

  it('renders export button if feature flag is enabled', function () {
    renderWithFeatureFlagValue({ toolbarEnabled: 'true', exportButtonEnabled: 'true' });
    expect(screen.getByTestId('pipeline-toolbar-export-aggregation-button')).to.exist;
  });
});

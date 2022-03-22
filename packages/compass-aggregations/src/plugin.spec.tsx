import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from './stores/store';
import Aggregations from './plugin';

const renderWithFeatureFlagValue = (value: string) => {
  process.env.COMPASS_SHOW_NEW_AGGREGATION_TOOLBAR = value;
  const store = configureStore({});
  render(<Aggregations store={store} />);
};

describe('Aggregations [Plugin]', function () {
  it('renders new toolbar when feature flag is enabled', function () {
    renderWithFeatureFlagValue('true');
    expect(screen.getByTestId('pipeline-toolbar')).to.exist;
  });

  it('renders legacy toolbar when feature flag is not enabled', function () {
    renderWithFeatureFlagValue('false');
    expect(screen.getByTestId('legacy-pipeline-toolbar')).to.exist;
  });
});

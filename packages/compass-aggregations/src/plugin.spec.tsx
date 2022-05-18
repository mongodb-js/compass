import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from './stores/store';
import Aggregations from './plugin';

const renderPlugin = () => {
  const store = configureStore({});
  render(
    <Aggregations showExportButton={true} showRunButton={true} store={store} />
  );
};

describe('Aggregations [Plugin]', function () {
  it('should render plugin with toolbar and export button', function () {
    renderPlugin();
    expect(screen.getByTestId('pipeline-toolbar')).to.exist;
    expect(screen.getByTestId('pipeline-toolbar-export-aggregation-button')).to.exist;
  });
});

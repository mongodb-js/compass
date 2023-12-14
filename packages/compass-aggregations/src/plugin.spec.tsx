import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from '../test/configure-store';
import { AggregationsPlugin } from './plugin';
import { Provider } from 'react-redux';

const renderPlugin = () => {
  const store = configureStore();
  const metadata = {} as any;
  render(
    <Provider store={store}>
      <AggregationsPlugin {...metadata} />
    </Provider>
  );
};

describe('Aggregations [Plugin]', function () {
  it('should render plugin with toolbar and export button', function () {
    renderPlugin();
    expect(screen.getByTestId('pipeline-toolbar')).to.exist;
    expect(screen.getByTestId('pipeline-toolbar-export-aggregation-button')).to
      .exist;
  });
});

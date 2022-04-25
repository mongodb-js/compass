import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { css } from '@mongodb-js/compass-components';
import { Provider } from 'react-redux';
import type { SinonSpy } from 'sinon';

import configureStore from '../../stores/store';

import { PipelineResultsHeader } from './pipeline-results-header';

describe('PipelineResultsHeader Component', function () {
  let onRetrySpy: SinonSpy;
  beforeEach(function () {
    onRetrySpy = spy();
    render(
      <Provider store={configureStore()}>
        <PipelineResultsHeader
          className={css({})}
          onChangeResultsView={() => {}}
          resultsView="document"
          error={'Unexpected error'}
          onRetry={onRetrySpy}
        />
      </Provider>
    );
  });
  it('renders header', function () {
    expect(screen.getByTestId('pipeline-results-header')).to.exist;
  });

  it('renders error banner', function () {
    const container = screen.getByTestId('pipeline-results-error');
    expect(within(container).getByTestId('banner-action')).to.exist;
  });

  it('retries on error', function () {
    expect(onRetrySpy.calledOnce).to.be.false;
    const container = screen.getByTestId('pipeline-results-error');
    userEvent.click(within(container).getByTestId('banner-action'));
    expect(onRetrySpy.calledOnce).to.be.true;
  });
});

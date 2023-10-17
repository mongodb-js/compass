import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../test/configure-store';
import StageToolbar from './';
import {
  changeStageCollapsed,
  changeStageDisabled,
} from '../../modules/pipeline-builder/stage-editor';

const renderStageToolbar = () => {
  const store = configureStore({
    pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
  });
  render(
    <Provider store={store}>
      <StageToolbar index={0} />
    </Provider>
  );
  return store;
};

describe('StageToolbar', function () {
  it('renders collapse button', function () {
    renderStageToolbar();
    expect(screen.getByLabelText('Collapse')).to.exist;
  });
  it('renders stage number text', function () {
    renderStageToolbar();
    expect(screen.getByText('Stage 1')).to.exist;
  });
  it('render stage operator select', function () {
    renderStageToolbar();
    expect(screen.getByTestId('stage-operator-combobox')).to.exist;
  });
  it('renders stage enable/disable toggle', function () {
    renderStageToolbar();
    expect(screen.getByLabelText('Exclude stage from pipeline')).to.exist;
  });
  context('renders stage text', function () {
    it('when stage is disabled', function () {
      const store = renderStageToolbar();
      store.dispatch(changeStageDisabled(0, true));
      expect(
        screen.getByText('Stage disabled. Results not passed in the pipeline.')
      ).to.exist;
    });
    it('when stage is collapsed', function () {
      const store = renderStageToolbar();
      store.dispatch(changeStageCollapsed(0, true));
      expect(
        screen.getByText(
          'A sample of the aggregated results from this stage will be shown below.'
        )
      ).to.exist;
    });
  });
  it('renders option menu', function () {
    renderStageToolbar();
    expect(screen.getByTestId('stage-option-menu-button')).to.exist;
  });
});

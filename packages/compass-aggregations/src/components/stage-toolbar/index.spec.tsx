import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../stores/store';
import { StageToolbar } from './';

const renderStageToolbar = (
  props: Partial<ComponentProps<typeof StageToolbar>> = {}
) => {
  render(
    <Provider
      store={configureStore({
        sourcePipeline: [
          { $match: { _id: 1 } },
          { $limit: 10 },
          { $out: 'out' },
        ],
      })}
    >
      <StageToolbar
        hasServerError={false}
        hasSyntaxError={false}
        index={0}
        isAutoPreviewing={false}
        isCollapsed={false}
        isDisabled={false}
        onFocusModeEnableClick={() => {}}
        {...props}
      />
    </Provider>
  );
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
      renderStageToolbar({ isDisabled: true });
      expect(
        screen.getByText('Stage disabled. Results not passed in the pipeline.')
      ).to.exist;
    });
    it('when stage is collapsed', function () {
      renderStageToolbar({ isCollapsed: true });
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

import React from 'react';
import { screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { renderWithStore } from '../../../test/configure-store';
import StageToolbar from './';
import {
  changeStageCollapsed,
  changeStageDisabled,
} from '../../modules/pipeline-builder/stage-editor';

const renderStageToolbar = async () => {
  const result = await renderWithStore(<StageToolbar index={0} />, {
    pipeline: [{ $match: { _id: 1 } }, { $limit: 10 }, { $out: 'out' }],
  });
  return result.plugin.store;
};

describe('StageToolbar', function () {
  it('renders collapse button', async function () {
    await renderStageToolbar();
    expect(screen.getByLabelText('Collapse')).to.exist;
  });
  it('renders stage number text', async function () {
    await renderStageToolbar();
    expect(screen.getByText('Stage 1')).to.exist;
  });
  it('render stage operator select', async function () {
    await renderStageToolbar();
    expect(screen.getByTestId('stage-operator-combobox')).to.exist;
  });
  it('renders stage enable/disable toggle', async function () {
    await renderStageToolbar();
    expect(screen.getByLabelText('Exclude stage from pipeline')).to.exist;
  });
  context('renders stage text', function () {
    it('when stage is disabled', async function () {
      const store = await renderStageToolbar();
      store.dispatch(changeStageDisabled(0, true));
      expect(
        screen.getByText('Stage disabled. Results not passed in the pipeline.')
      ).to.exist;
    });
    it('when stage is collapsed', async function () {
      const store = await renderStageToolbar();
      store.dispatch(changeStageCollapsed(0, true));
      expect(
        screen.getByText(
          'A sample of the aggregated results from this stage will be shown below.'
        )
      ).to.exist;
    });
  });
  it('renders option menu', async function () {
    await renderStageToolbar();
    expect(screen.getByTestId('stage-option-menu-button')).to.exist;
  });
});

import type { ComponentProps } from 'react';
import React from 'react';
import { screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { renderWithStore } from '../../../test/configure-store';
import { PipelineResultsHeader } from './pipeline-results-header';

const renderPipelineResultsHeader = (
  props: Partial<ComponentProps<typeof PipelineResultsHeader>> = {}
) => {
  return renderWithStore(
    <PipelineResultsHeader
      isMergeOrOutPipeline={false}
      onExpand={() => {}}
      onCollapse={() => {}}
      onChangeResultsView={() => {}}
      resultsViewType={'document'}
      {...props}
    />
  );
};

describe('PipelineResultsHeader', function () {
  it('renders pipeline export actions', async function () {
    await renderPipelineResultsHeader();

    expect(screen.getByText('Export Data')).to.be.visible;
    expect(screen.getByText('Export Code')).to.be.visible;
  });
});

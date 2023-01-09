import React from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import configureStore from '../../stores/store';
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';

const SOURCE_PIPELINE = [{$match: {_id: 1}}, {$limit: 10}, {$out: 'out'}];

const renderPipelineBuilderUIWorkspace = (props = {}, options = {}) => {
  render(
    <Provider store={configureStore({
      sourcePipeline: SOURCE_PIPELINE,
      ...options
    })}>
      <PipelineBuilderUIWorkspace stageIds={[]} {...props} />
    </Provider>
  );
};

describe('PipelineBuilderUIWorkspace [Component]', function () {
  it('renders', function () {
    expect(() => renderPipelineBuilderUIWorkspace()).to.not.throw;
  });

  context('when pipeline is not empty', function () {
    it('renders the stages', function () {
      renderPipelineBuilderUIWorkspace();
      expect(screen.getAllByTestId('stage-card')).to.have.lengthOf(3);
    });

    it('renders add stage icon button between stages', function () {
      renderPipelineBuilderUIWorkspace();
      const buttons = screen.getAllByTestId('add-stage-icon-button');
      expect(buttons.length).to.equal(3);
    });

    it('renders add stage button', function () {
      renderPipelineBuilderUIWorkspace();
      const buttons = screen.getAllByTestId('add-stage');
      expect(buttons.length).to.equal(1);
      expect(buttons[0]).to.have.text('Add Stage');
    });
  });

  context('when pipeline is empty', function () {
    it('does not render any stage', function () {
      renderPipelineBuilderUIWorkspace({}, { sourcePipeline: [] });
      expect(screen.queryByTestId('stage-card')).to.not.exist;
    });

    it('renders add stage button', function () {
      renderPipelineBuilderUIWorkspace({}, { sourcePipeline: [] });
      const buttons = screen.getAllByTestId('add-stage');
      expect(buttons.length).to.equal(1);
      expect(buttons[0]).to.have.text('Add Stage');
    });
  });
});

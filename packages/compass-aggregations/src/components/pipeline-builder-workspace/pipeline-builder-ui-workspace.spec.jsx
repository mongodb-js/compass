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

    it('adds a stage to the start of pipeline when first icon button is clicked', function () {
      renderPipelineBuilderUIWorkspace();
      const buttons = screen.getAllByTestId('add-stage-icon-button');
      buttons[0].click();
      expect(screen.getAllByTestId('stage-card')).to.have.lengthOf(4);
      
      const stageNames = screen
        .getAllByLabelText('Select a stage operator')
        .map((el) => el.getAttribute('value'));
      
      expect(stageNames).to.deep.equal(['', '$match', '$limit', '$out']);
    });

    it('adds a stage at the correct position of pipeline when last icon button is clicked', function () {
      renderPipelineBuilderUIWorkspace();
      const buttons = screen.getAllByTestId('add-stage-icon-button');
      buttons[2].click();
      expect(screen.getAllByTestId('stage-card')).to.have.lengthOf(4);
      
      const stageNames = screen
        .getAllByLabelText('Select a stage operator')
        .map((el) => el.getAttribute('value'));
      
      // last icon button appears between last two stages and when clicked
      // it adds a stage between those 2 stages
      expect(stageNames).to.deep.equal(['$match', '$limit', '', '$out']);
    });

    it('adds a stage at the end when (text) add stage button is clicked', function () {
      renderPipelineBuilderUIWorkspace();
      const button = screen.getByTestId('add-stage');
      button.click();

      const stageNames = screen
        .getAllByLabelText('Select a stage operator')
        .map((el) => el.getAttribute('value'));
      expect(stageNames).to.deep.equal(['$match', '$limit', '$out', '']);
    });
  });

  context('when pipeline is empty', function () {
    it('does not render any stage', function () {
      renderPipelineBuilderUIWorkspace({}, { sourcePipeline: [] });
      expect(screen.queryByTestId('stage-card')).to.not.exist;
    });

    it('does not render icon buttons', function () {
      renderPipelineBuilderUIWorkspace({}, { sourcePipeline: [] });
      expect(screen.queryByTestId('add-stage-icon-button')).to.not.exist;
    });

    it('renders (text) add stage button', function () {
      renderPipelineBuilderUIWorkspace({}, { sourcePipeline: [] });
      const button = screen.getByTestId('add-stage');
      expect(button).to.exist;
      expect(button).to.have.text('Add Stage');
    });

    it('adds a stage when (text) button is clicked', function () {
      renderPipelineBuilderUIWorkspace({}, { sourcePipeline: [] });
      const button = screen.getByTestId('add-stage');
      button.click();
      expect(screen.getAllByTestId('stage-card')).to.have.lengthOf(1);
    })
  });
});

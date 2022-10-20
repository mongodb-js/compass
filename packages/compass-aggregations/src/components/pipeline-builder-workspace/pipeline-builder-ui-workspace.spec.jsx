import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import configureStore from '../../stores/store'
import PipelineBuilderUIWorkspace from './pipeline-builder-ui-workspace';
import Stage from '../stage';

function renderPipelineStageEditor(options) {
  const store = configureStore(options);
  return mount(
    <Provider store={store}>
      <PipelineBuilderUIWorkspace></PipelineBuilderUIWorkspace>
    </Provider>
  );
}

describe('PipelineBuilderUIWorkspace [Component]', function () {
  it('renders', function () {
    expect(() => renderPipelineStageEditor()).to.not.throw;
  });

  it('renders the stages contained in the pipeline', function () {
    const wrapper = renderPipelineStageEditor({
      sourcePipeline: [{$match: {_id: 1}}, {$limit: 10}, {$out: 'out'}]
    });
    expect(wrapper.find(Stage)).to.have.lengthOf(3);
  });
});

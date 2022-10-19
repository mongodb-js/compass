import React from 'react';
import { shallow } from 'enzyme';
import { expect } from 'chai';
import { PipelineBuilderUIWorkspace } from './pipeline-builder-ui-workspace';
import Stage from '../stage';

/* eslint react/prop-types: 0 */
function createPipelineWorkspace({
  toggleInputDocumentsCollapsed = () => {},
  refreshInputDocuments = () => {},
  openLink = () => {},
  inputDocuments = {},
} = {}) {
  return (<PipelineBuilderUIWorkspace
    stageIds={[]}
    inputDocuments={inputDocuments}
    toggleInputDocumentsCollapsed={toggleInputDocumentsCollapsed}
    refreshInputDocuments={refreshInputDocuments}
    openLink={openLink}
  />);
}

describe('PipelineWorkspace [Component]', function() {
  it('renders', function() {
    shallow(createPipelineWorkspace({
      inputDocuments: {
        documents: [],
        isLoading: false,
        isExpanded: true,
        count: 0
      }
    }));
  });

  it('renders the stages contained in the pipeline', function() {
    const wrapper = shallow(createPipelineWorkspace({
      inputDocuments: {
        documents: [],
        isLoading: false,
        isExpanded: true,
        count: 0
      }
    }));
    expect(wrapper.find(Stage)).to.have.lengthOf(0);
  });
});

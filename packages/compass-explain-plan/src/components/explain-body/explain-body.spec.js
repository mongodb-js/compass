import React from 'react';
import { mount } from 'enzyme';
import ExplainBody from 'components/explain-body';

describe('ExplainBody [Component]', () => {
  let component;
  const explain = {
    viewType: 'tree',
    rawExplainObject: {},
    nReturned: 0,
    totalKeysExamined: 0,
    totalDocsExamined: 0,
    executionTimeMillis: 0,
    inMemorySort: false,
    indexType: 'UNAVAILABLE',
    index: null
  };
  const treeStages = {};
  const openLinkSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <ExplainBody
        explain={explain}
        openLink={openLinkSpy}
        treeStages={treeStages} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders ExplainSummary component', () => {
    expect(component.find('ExplainSummary')).to.be.not.present();
  });
});

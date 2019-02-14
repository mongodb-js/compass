import React from 'react';
import { mount } from 'enzyme';
import ExplainBody from 'components/explain-body';
import AppRegistry from 'hadron-app-registry';

import styles from './explain-body.less';

describe('ExplainBody [Component]', () => {
  let component;
  const appRegistry = new AppRegistry();
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
  const openLinkSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <ExplainBody
        explain={explain}
        openLink={openLinkSpy}
        appRegistry={appRegistry} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['explain-body']}`)).to.be.present();
  });
});

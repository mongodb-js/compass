import React from 'react';
import { mount } from 'enzyme';
import ExplainSummary from 'components/explain-summary';

import styles from './explain-summary.less';

describe('ExplainSummary [Component]', () => {
  let component;
  const nReturned = 0;
  const totalKeysExamined = 0;
  const totalDocsExamined = 0;
  const executionTimeMillis = 0;
  const inMemorySort = false;
  const indexType = 'UNAVAILABLE';
  const index = null;
  const openLinkSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <ExplainSummary
        nReturned={nReturned}
        totalKeysExamined={totalKeysExamined}
        totalDocsExamined={totalDocsExamined}
        executionTimeMillis={executionTimeMillis}
        inMemorySort={inMemorySort}
        indexType={indexType}
        index={index}
        openLink={openLinkSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['explain-summary']}`)).to.be.present();
  });
});

import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import ExplainSummary from '../explain-summary';
import styles from './explain-summary.module.less';

describe('ExplainSummary [Component]', function() {
  let component;
  const nReturned = 0;
  const totalKeysExamined = 0;
  const totalDocsExamined = 0;
  const executionTimeMillis = 0;
  const inMemorySort = false;
  const indexType = 'UNAVAILABLE';
  const index = null;
  const openLinkSpy = sinon.spy();

  beforeEach(function() {
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

  afterEach(function() {
    component = null;
  });

  it('renders the correct root classname', function() {
    expect(component.find(`.${styles['explain-summary']}`)).to.be.present();
  });
});

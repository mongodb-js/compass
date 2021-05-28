import React from 'react';
import { mount } from 'enzyme';
import SummaryIndexStat from '../summary-index-stat';

import styles from './summary-index-stat.less';

describe('SummaryIndexStat [Component]', () => {
  let component;
  const dataLink = 'https://docs.mongodb.com/master/reference/explain-results/';
  const indexType = 'MULTIPLE';
  const index = null;
  const openLinkSpy = sinon.spy();

  beforeEach(() => {
    component = mount(
      <SummaryIndexStat
        dataLink={dataLink}
        indexType={indexType}
        index={index}
        openLink={openLinkSpy} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['summary-index-stat']}`)).to.be.present();
  });
});

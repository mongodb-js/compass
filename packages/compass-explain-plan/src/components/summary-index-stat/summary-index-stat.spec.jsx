import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SummaryIndexStat from '../summary-index-stat';
import styles from './summary-index-stat.module.less';

describe('SummaryIndexStat [Component]', function () {
  let component;
  const dataLink = 'https://docs.mongodb.com/master/reference/explain-results/';
  const indexType = 'MULTIPLE';
  const index = null;

  beforeEach(function () {
    component = mount(
      <SummaryIndexStat
        dataLink={dataLink}
        indexType={indexType}
        index={index}
      />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find(`.${styles['summary-index-stat']}`)).to.be.present();
  });
});

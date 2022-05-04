import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SummaryStat from '../summary-stat';
import styles from './summary-stat.module.less';

describe('SummaryStat [Component]', function () {
  let component;
  const dataLink =
    'https://docs.mongodb.com/master/reference/explain-results/#explain.executionStats.nReturned';
  const label = 'Documents Returned:';

  beforeEach(function () {
    component = mount(<SummaryStat dataLink={dataLink} label={label} />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find(`.${styles['summary-stat']}`)).to.be.present();
  });
});

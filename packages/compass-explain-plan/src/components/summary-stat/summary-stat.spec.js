import React from 'react';
import { mount } from 'enzyme';
import SummaryStat from 'components/summary-stat';

import styles from './summary-stat.less';

describe('SummaryStat [Component]', () => {
  let component;
  const dataLink = 'https://docs.mongodb.com/master/reference/explain-results/#explain.executionStats.nReturned';
  const label = 'Documents Returned:';
  const openLinkSpy = sinon.spy();

  beforeEach(() => {
    component = mount(<SummaryStat dataLink={dataLink} label={label} openLink={openLinkSpy} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['summary-stat']}`)).to.be.present();
  });
});

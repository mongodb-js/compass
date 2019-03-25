import React from 'react';
import { mount } from 'enzyme';

import Aggregations from 'components/aggregations';
import configureStore from 'stores';
import styles from './aggregations.less';

describe('Aggregations [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<Aggregations store={configureStore()} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.aggregations}`)).to.be.present();
  });
});

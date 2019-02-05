import React from 'react';
import { mount } from 'enzyme';
import ExplainPlan from 'components/explain-plan';
import store from 'stores';
import styles from './explain-plan.less';

describe('CompassSchemaValidation [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<ExplainPlan store={store} />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });
});

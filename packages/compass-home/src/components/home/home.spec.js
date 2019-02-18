import React from 'react';
import { mount } from 'enzyme';

import { Home } from 'components/home';
import ToggleButton from 'components/toggle-button';
import styles from './home.less';

describe('Home [Component]', () => {
  let component;
  let toggleStatus;

  beforeEach(() => {
    toggleStatus = sinon.spy();
    component = mount(<Home toggleStatus={toggleStatus} status="enabled" />);
  });

  afterEach(() => {
    component = null;
    toggleStatus = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.be.present();
  });

  it('should contain one <h2> tag', () => {
    expect(component.find('h2')).to.have.length(1);
  });

  it('should contain one <ToggleButton />', () => {
    expect(component.find(ToggleButton)).to.have.length(1);
  });

  it('should initially have prop {status: \'enabled\'}', () => {
    expect(component.prop('status')).to.equal('enabled');
  });
});

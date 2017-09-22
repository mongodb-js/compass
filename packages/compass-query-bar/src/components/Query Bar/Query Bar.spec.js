import React from 'react';
import { mount } from 'enzyme';

import QueryBar from 'components/Query Bar';
import ToggleButton from 'components/toggle-button';
import styles from './Query Bar.less';

describe('QueryBar [Component]', () => {
  let component;
  let actions;

  beforeEach((done) => {
    actions = { toggleStatus: sinon.stub() };
    component = mount(<QueryBar actions={actions} />);
    done();
  });

  afterEach((done) => {
    component = null;
    actions = null;
    done();
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles.root}`)).to.have.length(1);
  });

  it('should contain one <h2> tag', function() {
    expect(component.find('h2')).to.have.length(1);
  });

  it('should contain one <ToggleButton />', function() {
    expect(component.find(ToggleButton)).to.have.length(1);
  });

  it('should initially have prop {status: \'enabled\'}', function() {
    expect(component.prop('status')).to.equal('enabled');
  });
});

import React from 'react';
import { mount } from 'enzyme';

import ToggleButton from 'components/toggle-button';
import styles from './toggle-button.less';

describe('ToggleButton [Component]', () => {
  let component;

  beforeEach((done) => {
    component = mount(<ToggleButton>Test</ToggleButton>);
    done();
  });

  afterEach((done) => {
    component = null;
    done();
  });

  it('renders the correct root classnames', () => {
    expect(component.find(`.${styles.button}`)).to.have.length(1);
    expect(component.find(`.${styles['button--ghost']}`)).to.have.length(1);
    expect(component.find(`.${styles['button--animateFromTop']}`)).to.have.length(1);
  });

  it('should contain one <span> tag', function() {
    expect(component.find('span')).to.have.length(1);
  });

  it('should have the correct button text', function() {
    expect(component.text()).to.equal('Test');
  });
});

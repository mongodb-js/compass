import React from 'react';
import { mount } from 'enzyme';

import CollectionStats from 'components/collection-stats';
import ToggleButton from 'components/toggle-button';
import styles from './collection-stats.less';

describe('collection-stats [Component]', () => {
  let component;
  let actions;

  beforeEach((done) => {
    actions = { toggleStatus: sinon.stub() };
    component = mount(<CollectionStats actions={actions} />);
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

import React from 'react';
import { mount } from 'enzyme';

import Status from 'components/status';
import styles from './status.less';

describe('Status [Component]', () => {
  let component;
  let actions;

  beforeEach((done) => {
    actions = { done: sinon.stub() };
    component = mount(<Status actions={actions} />);
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
});

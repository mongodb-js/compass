import React from 'react';
import { shallow } from 'enzyme';

import StageWorkspace from 'components/stage-workspace';
import styles from './stage-workspace.less';

describe('StageWorkspace [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StageWorkspace />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-workspace']}`)).to.be.present();
  });
});

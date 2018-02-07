import React from 'react';
import { shallow } from 'enzyme';

import PipelineWorkspace from 'components/pipeline-workspace';
import styles from './pipeline-workspace.less';

describe('PipelineWorkspace [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<PipelineWorkspace />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['pipeline-workspace']}`)).to.be.present();
  });
});

import React from 'react';
import { mount } from 'enzyme';
import ExplainTree from 'components/explain-tree';

import styles from './explain-tree.less';

describe('ExplainTree [Component]', () => {
  let component;
  const nodes = [];
  const links = [];
  const width = 100;
  const height = 100;

  beforeEach(() => {
    component = mount(
      <ExplainTree
        nodes={nodes}
        links={links}
        width={width}
        height={height} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the correct root classname', () => {
    expect(component.find(`.${styles['explain-tree']}`)).to.be.present();
  });
});

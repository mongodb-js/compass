import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ExplainTree from '../explain-tree';
import styles from './explain-tree.module.less';

describe('ExplainTree [Component]', function () {
  let component;
  const nodes = [];
  const links = [];
  const width = 100;
  const height = 100;

  beforeEach(function () {
    component = mount(
      <ExplainTree nodes={nodes} links={links} width={width} height={height} />
    );
  });

  afterEach(function () {
    component = null;
  });

  it('renders the correct root classname', function () {
    expect(component.find(`.${styles['explain-tree']}`)).to.be.present();
  });
});

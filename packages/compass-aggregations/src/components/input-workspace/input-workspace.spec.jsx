import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import InputWorkspace from '../input-workspace';
import styles from './input-workspace.module.less';

describe('InputWorkspace [Component]', function() {
  let component;

  beforeEach(function() {
    component = shallow(
      <InputWorkspace
        documents={[]}
        isLoading
        isExpanded
        openLink={sinon.spy()}
        count={10} />
    );
  });

  afterEach(function() {
    component = null;
  });

  it('renders the wrapper div', function() {
    expect(component.find(`.${styles['input-workspace']}`)).to.be.present();
  });
});

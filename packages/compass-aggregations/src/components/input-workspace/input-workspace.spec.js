import React from 'react';
import { shallow } from 'enzyme';

import InputWorkspace from 'components/input-workspace';
import styles from './input-workspace.less';

describe('InputWorkspace [Component]', () => {
  let component;
  const inputDocs = {
    count: 10,
    documents: []
  };

  beforeEach(() => {
    component = shallow(
      <InputWorkspace inputDocuments={inputDocs} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['input-workspace']}`)).to.be.present();
  });
});

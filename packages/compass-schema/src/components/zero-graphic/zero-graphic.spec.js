import React from 'react';
import { shallow } from 'enzyme';
import ZeroGraphic from 'components/zero-graphic';
import styles from './zero-graphic.less';

describe('ZeroGraphic [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<ZeroGraphic />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['zero-graphic']}`)).to.be.present();
  });
});

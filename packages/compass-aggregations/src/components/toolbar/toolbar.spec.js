import React from 'react';
import { shallow } from 'enzyme';

import Toolbar from 'components/toolbar';
import BuilderToolbar from 'components/builder-toolbar';
import PreviewToolbar from 'components/preview-toolbar';

import styles from './toolbar.less';

describe('Toolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<Toolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles.toolbar}`)).to.be.present();
  });

  it('renders the builder toolbar', () => {
    expect(component.find(`.${styles.toolbar}`)).to.have.descendants(BuilderToolbar);
  });

  it('renders the preview toolbar', () => {
    expect(component.find(`.${styles.toolbar}`)).to.have.descendants(PreviewToolbar);
  });
});

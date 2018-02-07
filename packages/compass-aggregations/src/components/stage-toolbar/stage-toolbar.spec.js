import React from 'react';
import { shallow } from 'enzyme';

import StageToolbar from 'components/stage-toolbar';
import StageBuilderToolbar from 'components/stage-builder-toolbar';
import StagePreviewToolbar from 'components/stage-preview-toolbar';

import styles from './stage-toolbar.less';

describe('StageToolbar [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(<StageToolbar />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-toolbar']}`)).to.be.present();
  });

  it('renders the stage builder toolbar', () => {
    expect(component.find(`.${styles['stage-toolbar']}`))
      .to.have.descendants(StageBuilderToolbar);
  });

  it('renders the stage preview toolbar', () => {
    expect(component.find(`.${styles['stage-toolbar']}`))
      .to.have.descendants(StagePreviewToolbar);
  });
});

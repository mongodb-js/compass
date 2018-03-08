import React from 'react';
import { shallow } from 'enzyme';

import StagePreview from 'components/stage-preview';
import styles from './stage-preview.less';

describe('StagePreview [Component]', () => {
  let component;

  beforeEach(() => {
    component = shallow(
      <StagePreview
        documents={[]}
        isValid
        isLoading={false} />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the wrapper div', () => {
    expect(component.find(`.${styles['stage-preview']}`)).to.be.present();
  });
});

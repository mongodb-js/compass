import React from 'react';
import { mount } from 'enzyme';

import { InfoModal } from './info-modal';
import styles from './info-modal.module.less';

describe('InfoModal [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <InfoModal
        show
        hideInfoModal={() => {}}
      />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the title text', () => {
    const title = component.find('h4').text();
    const hasVersionZero = title.includes('mongosh v0.');
    const hasVersionOne = title.includes('mongosh v1.');
    const titleIsAccurate = hasVersionZero || hasVersionOne;
    expect(titleIsAccurate).to.equal(true);
  });

  it('renders the hotkeys key', () => {
    expect(component.find(`.${styles['info-modal-shortcuts-hotkey-key']}`).at(6)).to.have.text(
      'Ctrl+F'
    );
  });

  it('renders the hotkeys description', () => {
    expect(component.find(`.${styles['info-modal-shortcuts-hotkey']}`).at(6)).to.have.text(
      'Ctrl+FMoves the cursor Forward one character.'
    );
  });
});

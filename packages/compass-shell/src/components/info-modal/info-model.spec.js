import React from 'react';
import { mount } from 'enzyme';

import { InfoModal } from './info-modal';
import styles from './info-modal.less';

describe('InfoModal [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <InfoModal
        isInfoModalVisible
        hideInfoModal={() => {}}
      />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the title text', () => {
    expect(component.find('h4')).to.have.text(
      'MongoSH Beta'
    );
  });

  it('renders the hotkeys key', () => {
    expect(component.find(`.${styles['info-modal-shortcuts-hotkey-key']}`).at(5)).to.have.text(
      'Ctrl+F'
    );
  });

  it('renders the hotkeys description', () => {
    expect(component.find(`.${styles['info-modal-shortcuts-hotkey']}`).at(5)).to.have.text(
      'Ctrl+FMoves the cursor forwards one character.'
    );
  });
});

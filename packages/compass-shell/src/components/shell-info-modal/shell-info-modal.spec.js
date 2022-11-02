import React from 'react';
import { mount } from 'enzyme';

import ShellInfoModal from './shell-info-modal';


describe('InfoModal [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(
      <ShellInfoModal
        show
        hideInfoModal={() => {}}
      />
    );
  });

  afterEach(() => {
    component = null;
  });

  it('renders the title text', () => {
    const title = component.find('h1').text();
    const hasVersionZero = title.includes('mongosh v0.');
    const hasVersionOne = title.includes('mongosh v1.');
    const titleIsAccurate = hasVersionZero || hasVersionOne;
    expect(titleIsAccurate).to.equal(true);
  });

  it('renders the hotkeys key', () => {
    expect(component.text()).to.include('Ctrl+F');
  });

  it('renders the hotkeys description', () => {
    expect(component.text()).to.include('Ctrl+FMoves the cursor Forward one character.');
  });
});

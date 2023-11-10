import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import ShellInfoModal from './shell-info-modal';

describe('InfoModal [Component]', function () {
  let component;

  beforeEach(function () {
    component = mount(<ShellInfoModal show hideInfoModal={() => {}} />);
  });

  afterEach(function () {
    component = null;
  });

  it('renders the title text', function () {
    const title = component.find('h1').text();
    expect(title).to.match(/^mongosh v2\.\d+\.\d+/);
  });

  it('renders the hotkeys key', function () {
    expect(component.text()).to.include('CtrlF');
  });

  it('renders the hotkeys description', function () {
    expect(component.text()).to.include(
      'CtrlFMoves the cursor Forward one character.'
    );
  });
});

import React from 'react';
import { mount } from 'enzyme';

import ConfirmEditConnectionString from './confirm-edit-connection-string';

describe('ConfirmEditConnectionString [Component]', () => {
  let component;

  beforeEach(() => {
    component = mount(<ConfirmEditConnectionString isEditURIConfirm />);
  });

  afterEach(() => {
    component = null;
  });

  it('renders the title text', () => {
    expect(component.find('h1')).to.have.text(
      'Are you sure you want to edit your connection string?'
    );
  });

  it('renders the note text', () => {
    expect(component.find('div[id="edit-uri-note"]')).to.have.text(
      'Editing this connection string will reveal your credentials.'
    );
  });
});

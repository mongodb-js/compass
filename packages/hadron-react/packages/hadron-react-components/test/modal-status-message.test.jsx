import React from 'react';
import { expect } from 'chai';
import { shallow } from 'enzyme';
import { ModalStatusMessage } from '../';

describe('<ModalStatusMessage />', () => {
  const component = shallow(
    <ModalStatusMessage icon="error" message="bad things" type="error" />
  );
  const iconColumn = component.find('.col-md-1');
  const messageColumn = component.find('.col-md-11');

  it('sets the base class', () => {
    expect(component.hasClass('modal-status-error')).to.equal(true);
  });

  it('sets the child div', () => {
    expect(component.find('.row')).to.have.length(1);
  });

  it('sets the icon column', () => {
    expect(iconColumn).to.have.length(1);
  });

  it('sets the message column', () => {
    expect(messageColumn).to.have.length(1);
  });

  it('sets the icon', () => {
    expect(iconColumn.find('.fa-error')).to.have.length(1);
  });

  it('sets the message paragraph', () => {
    expect(messageColumn.find('.modal-status-error-message')).to.have.length(1);
  });

  it('sets the message text', () => {
    expect(messageColumn.find('.modal-status-error-message').text()).to.equal('bad things');
  });
});

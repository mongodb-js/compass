import { expect } from 'chai';
import { mount, shallow } from 'enzyme';
import React from 'react';
import sinon from 'sinon';
import { ModalStatusMessage } from '../';

describe('<ModalStatusMessage />', () => {
  context('when just showing some content', () => {
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

    it('does not show an interactible icon without click handler', () => {
      expect(component.find('.modal-status-error-icon-interactible')).not.to.be.present;
    });
  });

  context('when providing an icon clicked handler', () => {
    const clickSpy = sinon.spy();
    const component = mount(
      <ModalStatusMessage icon="times" message="An Error Occurred..." type="error" onIconClickHandler={clickSpy} />
    );

    it('is called when clicked', () => {
      component.find('.modal-status-error-icon-interactible').first().simulate('click');

      expect(clickSpy.called).to.be.true;
    });
  });
});

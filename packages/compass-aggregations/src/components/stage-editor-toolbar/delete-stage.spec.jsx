import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import { DeleteStage } from './delete-stage';

describe('DeleteStage [Component]', function () {
  context('when the component is rendered', function () {
    let component;
    const spy = sinon.spy();

    beforeEach(function () {
      component = mount(<DeleteStage index={1} onStageDeleteClick={spy} />);
    });

    afterEach(function () {
      component = null;
    });

    it('renders the correct root classname', function () {
      expect(component.find('DeleteStage')).to.be.present();
    });

    it('renders the collapse text', function () {
      expect(component.find('button')).to.have.prop('title', 'Delete Stage');
    });

    it('renders the delete button', function () {
      expect(component.find('Icon').first()).to.have.prop('glyph', 'Trash');
    });
  });

  context('when clicking on the button', function () {
    let component;
    const spy = sinon.spy();

    beforeEach(function () {
      component = mount(<DeleteStage index={1} onStageDeleteClick={spy} />);
    });

    afterEach(function () {
      component = null;
    });

    it('calls delete handler when clicked', function () {
      component.find('button').simulate('click');
      expect(spy.calledWith(1)).to.equal(true);
    });
  });
});

import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';
import { Tooltip } from '@mongodb-js/compass-components';

import { AddAfterStage } from './add-after-stage';

describe('AddAfterStage [Component]', function() {
  context('when the component is rendered', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(<AddAfterStage index={1} onAddStageClick={spy} />);
    });

    afterEach(function() {
      component = null;
    });

    it('renders + text', function() {
      expect(component.find('button').contains('+')).to.equal(true);
    });
    it('renders the tooltip', function() {
      expect(component.find(Tooltip)).to.be.present();
    });
  });

  context('when clicking on the button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(<AddAfterStage index={1} onAddStageClick={spy} />);
    });

    afterEach(function() {
      component = null;
    });

    context('when clicking on the button', function() {
      it('calls the action', function() {
        component.find('button').simulate('click');
        expect(spy.calledOnce).to.equal(true);
      });
    });
  });
});

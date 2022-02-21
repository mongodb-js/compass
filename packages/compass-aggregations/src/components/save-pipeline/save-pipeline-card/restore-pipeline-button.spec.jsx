import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import RestorePipelineButton from './restore-pipeline-button';
import styles from './restore-pipeline-button.module.less';

describe('RestorePipelineButton [Component]', function() {
  context('when the component is rendered', function() {
    let component;

    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(<RestorePipelineButton clickHandler={spy} />);
    });

    afterEach(function() {
      component = null;
    });

    it('restore pipeline button wrapper gets rendered', function() {
      expect(component.find(`.${styles['restore-pipeline']}`)).to.be.present();
    });

    it('restore pipeline text button is rendered', function() {
      expect(component.find(`.${styles['restore-pipeline-button']}`)).to.be.present();
    });

    it('button has "Open" text', function() {
      expect(component.find(`.${styles['restore-pipeline-button']}`).hostNodes()).to.contain.text('Open');
    });
  });

  context('when clicking on the open button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(<RestorePipelineButton clickHandler={spy} />);
    });

    afterEach(function() {
      component = null;
    });

    it('toggles the expansion', function() {
      component.find(`.${styles['restore-pipeline-button']}`).hostNodes().simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});

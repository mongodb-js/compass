import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import DeletePipelineButton from './delete-pipeline-button';
import styles from './delete-pipeline-button.module.less';

describe('DeletePipelineButton [Component]', function() {
  context('when the component is rendered', function() {
    let component;

    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(<DeletePipelineButton clickHandler={spy} />);
    });

    afterEach(function() {
      component = null;
    });

    it('delete pipeline button wrapper gets rendered', function() {
      expect(component.find(`.${styles['delete-pipeline']}`)).to.be.present();
    });

    it('delete pipeline text button is rendered', function() {
      expect(component.find(`.${styles['delete-pipeline-button']}`)).to.be.present();
    });

    it('button has trash icon', function() {
      expect(component.find('.fa-trash-o')).to.be.present();
    });
  });

  context('when clicking on the open button', function() {
    let component;
    const spy = sinon.spy();

    beforeEach(function() {
      component = mount(<DeletePipelineButton clickHandler={spy} />);
    });

    afterEach(function() {
      component = null;
    });

    it('toggles the expansion', function() {
      component.find(`.${styles['delete-pipeline-button']}`).hostNodes().simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});

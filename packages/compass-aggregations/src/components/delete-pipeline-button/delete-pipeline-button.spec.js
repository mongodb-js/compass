import React from 'react';
import { mount } from 'enzyme';

import DeletePipelineButton from 'components/delete-pipeline-button';
import styles from './delete-pipeline-button.less';

describe('DeletePipelineButton [Component]', () => {
  context('when the component is rendered', () => {
    let component;

    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<DeletePipelineButton clickHandler={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('delete pipeline button wrapper gets rendered', () => {
      expect(component.find(`.${styles['delete-pipeline']}`)).to.be.present();
    });

    it('delete pipeline text button is rendered', () => {
      expect(component.find(`.${styles['delete-pipeline-button']}`)).to.be.present();
    });

    it('button has "Open" text', () => {
      expect(component.find(`.${styles['delete-pipeline-button']}`)).to.contain.text('Delete');
    });
  });

  context('when clicking on the open button', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<DeletePipelineButton clickHandler={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('toggles the expansion', () => {
      component.find(`.${styles['delete-pipeline-button']}`).simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});

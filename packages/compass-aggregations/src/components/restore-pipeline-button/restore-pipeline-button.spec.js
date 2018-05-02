import React from 'react';
import { mount } from 'enzyme';

import RestorePipelineButton from 'components/restore-pipeline-button';
import styles from './restore-pipeline-button.less';

describe('RestorePipelineButton [Component]', () => {
  context('when the component is rendered', () => {
    let component;

    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<RestorePipelineButton clickHandler={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('restore pipeline button wrapper gets rendered', () => {
      expect(component.find(`.${styles['restore-pipeline']}`)).to.be.present();
    });

    it('restore pipeline text button is rendered', () => {
      expect(component.find(`.${styles['restore-pipeline-button']}`)).to.be.present();
    });

    it('button has "Open" text', () => {
      expect(component.find(`.${styles['restore-pipeline-button']}`).hostNodes()).to.contain.text('Open');
    });
  });

  context('when clicking on the open button', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<RestorePipelineButton clickHandler={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('toggles the expansion', () => {
      component.find(`.${styles['restore-pipeline-button']}`).hostNodes().simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});

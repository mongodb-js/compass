import React from 'react';
import { mount } from 'enzyme';

import AddAfterStage from './add-after-stage';
import styles from './add-after-stage.less';

describe('AddAfterStage [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<AddAfterStage index={1} stageAddedAfter={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['add-after-stage']}`)).to.be.present();
    });

    it('renders + text', () => {
      expect(component.find('button').contains('+')).to.equal(true);
    });
    it('renders the tooltip', () => {
      expect(component.find('.hadron-tooltip')).to.be.present();
    });
  });

  context('when clicking on the button', () => {
    let component;
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<AddAfterStage index={1} stageAddedAfter={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    context('when clicking on the button', () => {
      it('calls the action', () => {
        component.find('button').simulate('click');
        expect(spy.calledOnce).to.equal(true);
      });
    });
  });
});

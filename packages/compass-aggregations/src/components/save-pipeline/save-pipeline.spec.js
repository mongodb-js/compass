import React from 'react';
import { mount } from 'enzyme';

import SavePipeline from 'components/save-pipeline';
import styles from './save-pipeline.less';

describe('SavePipeline [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    const savedPipelines = {
      pipelines: [],
      isListVisible: false,
      isModalVisible: false,
      isModalError: false
    };
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<SavePipeline savedPipelines={savedPipelines} savedPipelinesListToggle={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('renders the title text', () => {
      expect(component.find('#saved-pipeline-header-title')).to.contain.text('Saved Pipelines');
    });

    it('renders the pipeline cards parent div', () => {
      expect(component.find(`.${styles['save-pipeline-cards']}`)).to.be.present();
    });

    it('renders the correct root classname', () => {
      expect(component.find(`.${styles['save-pipeline']}`)).to.be.present();
    });

    it('renders the the fa close button', () => {
      expect(component.find('.fa-times')).to.be.present();
    });
  });

  context('when clicking on the button', () => {
    let component;
    const savedPipelines = {
      pipelines: [],
      isListVisible: false,
      isModalVisible: false,
      isModalError: false
    };
    const spy = sinon.spy();

    beforeEach(() => {
      component = mount(<SavePipeline savedPipelines={savedPipelines} savedPipelinesListToggle={spy} />);
    });

    afterEach(() => {
      component = null;
    });

    it('toggles the expansion', () => {
      component.find('.fa.fa-times').simulate('click');
      expect(spy.calledOnce).to.equal(true);
    });
  });
});

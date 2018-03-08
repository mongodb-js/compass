import React from 'react';
import { mount } from 'enzyme';

import SavePipelineCard from 'components/save-pipeline-card';
import styles from './save-pipeline-card.less';

describe('SavePipelineCard [Component]', () => {
  context('when the component is rendered', () => {
    let component;
    let toggleSpy;
    let deleteSpy;
    let restoreSpy;

    const objectID = '0000006479e3bfa949f4ca6c';
    const name = 'Return average number of currywurst eaten in Berlin sorted by districts';

    beforeEach(() => {
      toggleSpy = sinon.spy();
      deleteSpy = sinon.spy();
      restoreSpy = sinon.spy();

      component = mount(
        <SavePipelineCard
          objectID={objectID}
          restorePipelineFrom={restoreSpy}
          restorePipelineModalToggle={toggleSpy}
          deletePipeline={deleteSpy}
          name={name} />
      );
    });

    afterEach(() => {
      component = null;
    });

    it('renders the save pipeline card div', () => {
      expect(component.find(`.${styles['save-pipeline-card']}`)).to.be.present();
    });

    it('renders save pipeline title div', () => {
      expect(component.find(`.${styles['save-pipeline-card-title']}`)).to.be.present();
    });

    it('renders the correct card name', () => {
      expect(component.find(`.${styles['save-pipeline-card-title']}`)).to.contain.text(name);
    });

    it('data-object-id selector value matches the passed in object id', () => {
      expect(component.find(`.${styles['save-pipeline-card']}`)).to.have.data('pipeline-object-id').equal(objectID);
    });
  });
});

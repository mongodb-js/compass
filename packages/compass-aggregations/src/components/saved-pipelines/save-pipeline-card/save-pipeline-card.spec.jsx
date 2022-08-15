import React from 'react';
import { mount } from 'enzyme';
import sinon from 'sinon';
import { expect } from 'chai';

import SavePipelineCard from './save-pipeline-card';
import styles from './save-pipeline-card.module.less';

describe('SavePipelineCard [Component]', function() {
  context('when the component is rendered', function() {
    let component;
    let toggleSpy;
    let deleteSpy;
    let restoreSpy;

    const objectID = '0000006479e3bfa949f4ca6c';
    const name = 'Return average number of currywurst eaten in Berlin sorted by districts';

    beforeEach(function() {
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

    afterEach(function() {
      component = null;
    });

    it('renders the save pipeline card div', function() {
      expect(component.find(`.${styles['save-pipeline-card']}`)).to.be.present();
    });

    it('renders save pipeline title div', function() {
      expect(component.find(`.${styles['save-pipeline-card-title']}`)).to.be.present();
    });

    it('renders the correct card name', function() {
      expect(component.find(`.${styles['save-pipeline-card-title']}`)).to.contain.text(name);
    });

    it('data-object-id selector value matches the passed in object id', function() {
      expect(component.find(`.${styles['save-pipeline-card']}`)).to.have.data('pipeline-object-id').equal(objectID);
    });
  });
});

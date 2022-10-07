import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import SavedPipelineCard from './saved-pipeline-card';
import { createStore } from 'redux';
import { Provider } from 'react-redux';

const store = createStore(() => {});

describe('SavedPipelineCard [Component]', function() {
  context('when the component is rendered', function() {
    let component;

    const objectID = '0000006479e3bfa949f4ca6c';
    const name = 'Return average number of currywurst eaten in Berlin sorted by districts';

    beforeEach(function() {
      component = mount(
        <Provider store={store}>
          <SavedPipelineCard id={objectID} name={name} />
        </Provider>
      );
    });

    afterEach(function() {
      component.unmount();
      component = null;
    });

    it('renders the save pipeline card div', function() {
      expect(component.find('div[data-testid="saved-pipeline-card"]')).to.be.present();
    });

    it('renders save pipeline title div', function() {
      expect(component.find('div[data-testid="saved-pipeline-card-name"]')).to.be.present();
    });

    it('renders the correct card name', function() {
      expect(component.find('div[data-testid="saved-pipeline-card-name"]')).to.contain.text(name);
    });

    it('data-object-id selector value matches the passed in object id', function() {
      expect(component.find('div[data-testid="saved-pipeline-card"]')).to.have.data('pipeline-object-id').equal(objectID);
    });
  });
});

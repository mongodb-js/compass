import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { SavedPipelines } from './saved-pipelines';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

const emptyStateTestId = 'p[data-testid="saved-pipelines-empty-state"]';

const store = createStore(() => {})

describe('SavedPipelines [Component]', function() {
  context('when the component is rendered', function() {
    let component;
    const savedPipelines = [];

    beforeEach(function() {
      component = mount(
        <Provider store={store}>
          <SavedPipelines
            savedPipelines={savedPipelines}
            namespace="test.test123"
          />
        </Provider>
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders the title text', function() {
      expect(
        component.find('p#saved-pipeline-header-title').first()
      ).to.contain.text('Saved Pipelines');
    });

    it('renders an empty state', function() {
      expect(
        component.find(emptyStateTestId)
      ).to.be.present();
    });

    it('renders the namespace', function () {

      expect(
        component.find('span[data-testid="saved-pipeline-header-title-namespace"]').first()
      ).to.contain.text('test.test123');
    });
  });

  context('rendered with pipelines', function() {
    let component;
    const savedPipelines = [{
      name: 'test name',
      id: 'test id'
    }];

    beforeEach(function() {
      component = mount(
        <Provider store={store}>
          <SavedPipelines
            savedPipelines={savedPipelines}
          />
        </Provider>
      );
    });

    afterEach(function() {
      component = null;
    });

    it('renders pipeline item', function() {
      expect(
        component.find('div[data-pipeline-object-id="test id"]')
      ).to.contain.text('test name');
    });

    it('does not render the empty state', function() {
      expect(
        component.find(emptyStateTestId)
      ).to.not.be.present();
    });
  });
});

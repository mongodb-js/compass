import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import configureStore from '../../stores';
import SampleDocuments from '../sample-documents';
import { Provider } from 'react-redux';

describe('SampleDocuments [Component]', function () {
  it('renders a valid and invalid document preview', function () {
    const component = mount(
      <Provider store={configureStore()}>
        <SampleDocuments />
      </Provider>
    );

    expect(
      component.find('[data-testid="matching-documents"]')
    ).to.be.present();
    expect(
      component.find('[data-testid="notmatching-documents"]')
    ).to.be.present();
  });
});

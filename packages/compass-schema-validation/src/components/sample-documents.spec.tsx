import React from 'react';
import { mount } from 'enzyme';
import { expect } from 'chai';
import { SampleDocuments } from './sample-documents';
import { Provider } from 'react-redux';
import { configureStore } from '../stores/store';

describe('SampleDocuments [Component]', function () {
  it('renders a valid and invalid document preview', function () {
    const store = configureStore({}, {} as any);
    const component = mount(
      <Provider store={store}>
        <SampleDocuments />
      </Provider>
    );

    expect(component.find('[data-testid="matching-documents"]')).to.exist;
    expect(component.find('[data-testid="notmatching-documents"]')).to.exist;
  });
});
